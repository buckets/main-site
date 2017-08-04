import * as Path from 'path'
import * as sqlite from 'sqlite'
import * as log from 'electron-log'

import {IStore, DataEventEmitter, ObjectEventType, ObjectEvent, IObject, IObjectClass} from '../store'
import {APP_ROOT} from './globals'

import { BucketStore } from '../models/bucket'
import { AccountStore } from '../models/account'
import { SimpleFINStore } from '../models/simplefin'
import { ReportStore } from '../models/reports'

import { isRegistered } from './drm'
import { rankBetween } from '../ranking'

export class NotFound extends Error {
  toString() {
    return `NotFound: ${this.message}`;
  }
}

async function ensureBucketsLicenseBucket(store:DBStore) {
  if (! await isRegistered()) {
    // Make sure there's a Buckets License bucket
    let license_bucket;
    try {
      license_bucket = await store.buckets.get(-1);  
    } catch(e) {
      if (e instanceof NotFound) {
        license_bucket = await store.buckets.add({
          name: 'Buckets License',
        })
        await store.query('UPDATE bucket SET id=-1 WHERE id=$id', {
          $id: license_bucket.id
        })
      } else {
        throw e;
      }
    }
    let groups = await store.buckets.listGroups();
    let group_id = null;
    if (groups.length) {
      group_id = groups[0].id;
    }
    let rows = await store.query(`
      SELECT id, ranking
      FROM bucket
      WHERE group_id=$group_id
      ORDER BY ranking
      LIMIT 1
      `, {$group_id: group_id});
    let ranking = 'b';
    if (rows.length) {
      let first_bucket = rows[0];
      if (first_bucket.id !== -1) {
        // There's a bucket in front
        ranking = rankBetween('a', first_bucket.ranking);
      }
    }
    await store.buckets.update(-1, {
      kind: 'goal-deposit',
      goal: 4000,
      deposit: 500,
      kicked: false,
      name: 'Buckets License',
      ranking: ranking,
      color: 'rgba(52, 152, 219,1.0)',
      group_id: group_id,
    })
  }
}

//--------------------------------------------------------------------------------
// DBStore
// The IStore for the main process
//--------------------------------------------------------------------------------
let ALLOWED_RE = /[^a-zA-Z0-9_]+/g
export function sanitizeDbFieldName(x) {
  return x.replace(ALLOWED_RE, '')
}
export class DBStore implements IStore {
  private _db:sqlite.Database;
  public data:DataEventEmitter;

  readonly accounts:AccountStore;
  readonly buckets:BucketStore;
  readonly connections:SimpleFINStore;
  readonly reports:ReportStore;
  constructor(private filename:string, private doTrialWork:boolean=false) {
    this.data = new DataEventEmitter();
    this.accounts = new AccountStore(this);
    this.buckets = new BucketStore(this);
    this.connections = new SimpleFINStore(this);
    this.reports = new ReportStore(this);
  }
  async open():Promise<DBStore> {
    this._db = await sqlite.open(this.filename, {promise:Promise})

    // upgrade database
    try {
      await this._db.migrate({
        migrationsPath: Path.join(APP_ROOT, 'migrations'),
      })  
    } catch(err) {
      log.error(err.stack);
      throw err;
    }

    if (this.doTrialWork) {
      try {
        await ensureBucketsLicenseBucket(this);  
      } catch(err) {
        log.error('Error adding buckets license bucket');
        log.error(err.stack);
      }
    }
    
    return this;
  }
  get db():sqlite.Database {
    return this._db;
  }
  publishObject(event:ObjectEventType, obj:IObject) {
    this.data.emit('obj', new ObjectEvent(event, obj));
  }
  async createObject<T extends IObject>(cls: IObjectClass<T>, data:Partial<T>):Promise<T> {
    let params = {};
    let columns = [];
    let values = [];
    Object.keys(data).forEach(key => {
      let snkey = sanitizeDbFieldName(key);
      columns.push(snkey);
      params['$'+snkey] = (<T>data)[key];
      values.push('$'+snkey);
    })
    let sql = `INSERT INTO ${cls.table_name} (${columns}) VALUES ( ${values} );`;
    let result = await this.db.run(sql, params);
    let obj = await this.getObject(cls, result.lastID);
    this.publishObject('update', obj);
    return obj;
  }
  async updateObject<T extends IObject>(cls: IObjectClass<T>, id:number, data:Partial<T>):Promise<T> {
    let params = {'$id': id};
    let settings = Object.keys(data).map(key => {
      let snkey = sanitizeDbFieldName(key);
      params['$'+snkey] = (<T>data)[key];
      return `${snkey}=$${snkey}`
    })
    let sql = `UPDATE ${cls.table_name}
      SET ${settings} WHERE id=$id;`;;
    await this.db.run(sql, params);
    let obj = await this.getObject<T>(cls, id);
    this.publishObject('update', obj);
    return obj
  }
  async getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T> {
    let sql = `SELECT *,'${cls.table_name}' as _type FROM ${cls.table_name}
    WHERE id=$id`;
    let ret = await this.db.get(sql, {$id: id});
    if (ret === undefined) {
      throw new NotFound(`${cls.table_name} ${id}`);
    }
    if (cls.fromdb !== undefined) {
      ret = cls.fromdb(ret);
    }
    return ret;
  }
  async listObjects<T extends IObject>(cls: IObjectClass<T>, args?:{where?:string, params?:{}, order?:string[]}):Promise<T[]> {
    let { where, params, order } = <any>(args || {});
    let select = `SELECT *,'${cls.table_name}' as _type FROM ${cls.table_name}`;
    if (where) {
      where = `WHERE ${where}`;
    }
    if (!params) {
      params = {};
    }
    let order_clause = 'ORDER BY id';
    if (order && order.length) {
      order_clause = `ORDER BY ${order.join(',')}`;
    }
    let sql = `${select} ${where} ${order_clause}`;
    let ret = this.db.all(sql, params);
    if (cls.fromdb) {
      ret.then(objects => {
        return objects.map(cls.fromdb);
      })
    }
    return ret;
  }
  async query(sql:string, params:{}):Promise<any> {
    return this.db.all(sql, params);
  }
  async deleteObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<any> {
    let obj = await this.getObject<T>(cls, id);
    let sql = `DELETE FROM ${cls.table_name} WHERE id=$id`;
    await this.db.run(sql, {$id: id});
    this.publishObject('delete', obj);
  }
}
