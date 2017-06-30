import * as Path from 'path'
import * as sqlite from 'sqlite'
import * as log from 'electron-log'

import {IStore, DataEventEmitter, ObjectEventType, ObjectEvent, IObject, IObjectClass} from '../store'
import {APP_ROOT} from './globals'

import {BucketStore} from '../models/bucket'
import {AccountStore} from '../models/account'


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
  constructor(private filename:string) {
    this.data = new DataEventEmitter();
    this.accounts = new AccountStore(this);
    this.buckets = new BucketStore(this);
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
    let ret = this.db.get(sql, {$id: id});
    if (cls.fromdb !== undefined) {
      ret.then(cls.fromdb);
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
