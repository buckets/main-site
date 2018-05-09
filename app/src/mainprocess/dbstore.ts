import * as Path from 'path'
import * as sqlite3 from 'sqlite3-offline'
import * as fs from 'fs-extra-promise'
import { AsyncDatabase } from '../async-sqlite'

import { PrefixLogger } from '../logging'

import {IStore, IBudgetBus, ObjectEventType, ObjectEvent, IObject, IObjectClass } from '../store'
import {APP_ROOT} from './globals'
import { Migration, migrations as jsmigrations } from './jsmigrations'

import { SubStore } from '../models/storebase'

import { isRegistered } from './drm'
import { rankBetween } from '../ranking'
import { sss } from '../i18n'
import { UndoTracker } from '../undo'

const log = new PrefixLogger('(dbstore)')

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
      license_bucket = await store.sub.buckets.get(-1);  
    } catch(e) {
      if (e instanceof NotFound) {
        license_bucket = await store.sub.buckets.add({
          name: sss('Buckets License'),
        })
        await store.query('UPDATE bucket SET id=-1 WHERE id=$id', {
          $id: license_bucket.id
        })
      } else {
        throw e;
      }
    }
    let groups = await store.sub.buckets.listGroups();
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
    await store.sub.buckets.update(-1, {
      kind: 'goal-deposit',
      goal: license_bucket.goal <= 100 ? 2900 : license_bucket.goal,
      deposit: license_bucket.deposit <= 100 ? 500 : license_bucket.deposit,
      kicked: false,
      name: sss('Buckets License'),
      ranking: ranking,
      color: 'rgba(52, 152, 219,1.0)',
      group_id: group_id,
    })
  }
}

//---------------------------------------------------------------------------
// DBStore
// The IStore for the main process
//---------------------------------------------------------------------------
let ALLOWED_RE = /[^a-zA-Z0-9_]+/g
export function sanitizeDbFieldName(x) {
  return x.replace(ALLOWED_RE, '')
}

async function upgradeDatabase(db:AsyncDatabase, migrations_path:string, js_migrations:Migration[]):Promise<any> {

  let logger = new PrefixLogger('(dbup)');
  await db.run(`CREATE TABLE IF NOT EXISTS _schema_version (
  id INTEGER PRIMARY KEY,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name TEXT UNIQUE
)`)

  //--------------------------------------------------------
  // old style of migrations
  let old_migrations = [];
  try {
    old_migrations = await db.all('SELECT id,name FROM migrations');
    logger.info('Old migrations present');
  } catch(err) {
  }
  if (old_migrations.length) {
    logger.info('Switching to new migrations method');
    // old style of migrations
    for (const row of old_migrations) {
      const name = `000${row.id}-${row.name}`.toLowerCase();
      logger.info('Inserting', name);
      await db.run(`INSERT INTO _schema_version (name) VALUES ($name)`, {$name: name})
    }
    logger.info('Dropping migrations');
    await db.run('DROP TABLE migrations')
  }
  // end old style of migrations
  //--------------------------------------------------------

  const applied = new Set<string>((await db.all<any>('SELECT name FROM _schema_version')).map(x => x.name));
  logger.info('Applied migrations:', Array.from(applied).join(', '))

  // collect all migrations (first js)
  let all_migrations:Migration[] = [...js_migrations];

  // collect file-based migrations
  const migrations = await new Promise<string[]>((resolve, reject) => {
    fs.readdir(migrations_path, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    })
  })
  for (const path of migrations) {
    const fullname = path.split('.')[0].toLowerCase();
    const order = Number(fullname.split('-')[0]);
    const name = fullname.split('-').slice(1).join('-');

    const fullpath = Path.resolve(migrations_path, path);
    const fullsql = await new Promise<string>((resolve, reject) => {
      fs.readFile(fullpath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.toString());
        }
      });
    });
    all_migrations.push({
      order,
      name,
      func: (db) => {
        return db.exec(fullsql);
      },
    })
  }

  // Check for duplicate patch names/orders
  let encountered_names = new Set<string>();
  let encountered_orders = new Set<number>();
  all_migrations.forEach(mig => {
    if (encountered_names.has(mig.name)) {
      throw new Error(`Duplicate schema patch name not allowed: ${mig.name} (${mig.order}) <${Array.from(encountered_names).join(',')}>`);
    }
    if (encountered_orders.has(mig.order)) {
      throw new Error(`Duplicate schema order not allowed: ${mig.order} ${Array.from(encountered_orders)}`);
    }
    encountered_names.add(mig.name);
    encountered_orders.add(mig.order);
  })

  // Sort by order
  all_migrations.sort((a,b) => {
    if (a.order < b.order) {
      return -1
    } else if (a.order > b.order) {
      return 1
    } else {
      return 0
    }
  })

  // Apply patches
  for (const migration of all_migrations) {
    const name = migration.name;
    const padded = `0000${migration.order}`.slice(-4);
    const fullname = `${padded}-${migration.name}`
    const plog = logger.child(`(patch ${fullname})`)
    if (applied.has(fullname)) {
      // already applied
    } else {
      plog.info('applying...');
      try {
        await db.run('BEGIN EXCLUSIVE TRANSACTION');
        await migration.func(db);
        await db.run(`INSERT INTO _schema_version (name) VALUES ($name)`, {$name: fullname});
        await db.run('COMMIT TRANSACTION');
        plog.info('commit');
      } catch(err) {
        plog.error('Error while running patch');
        plog.warn(err);
        await db.run('ROLLBACK');

        // hold over from prior flakey migrations
        if (migration.order <= 7 && (
            err.toString().indexOf('duplicate column name') !== -1
            || err.toString().indexOf('already exists') !== -1
          )) {
          // we'll pretend it succeeded
          await db.run(`INSERT INTO _schema_version (name) VALUES ($name)`, {$name: name});
          plog.warn(err.toString());
          plog.info('Assuming patch was already applied');
        } else {
          // legitimate error
          throw err;
        }
      }
      plog.info('applied.');
    }
  }
  logger.info('schema is in sync');

  // logger.info('schema list:')
  // let sqlite_master = await db.all('SELECT * FROM sqlite_master');
  // sqlite_master.forEach(item => {
  //   logger.info(`${item.type} ${item.name}`);
  // })
}

/**
 * The IStore for the main process
 */
export class DBStore implements IStore {
  private _db:AsyncDatabase;
  readonly undo:UndoTracker;
  readonly sub:SubStore;

  constructor(private filename:string, readonly bus:IBudgetBus, private doTrialWork:boolean=false) {
    this.sub = new SubStore(this);
    this.undo = new UndoTracker(this);
  }
  async open():Promise<DBStore> {
    this._db = new AsyncDatabase(new sqlite3.Database(this.filename))

    // upgrade database
    try {
      log.info('Doing database migrations');
      await upgradeDatabase(this._db, Path.join(APP_ROOT, 'migrations'), jsmigrations);
    } catch(err) {
      log.error('Error during database migrations');
      log.error(err.stack);
      throw err;
    }

    // ensure triggers are enabled
    try {
      await this.query('DELETE FROM x_trigger_disabled', {})
    } catch(err) {
      log.error('Error enabling triggers');
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
    
    // track undos
    await this.undo.start();

    return this;
  }
  get db():AsyncDatabase {
    return this._db;
  }
  publishObject(event:ObjectEventType, obj:IObject) {
    this.bus.obj.emit(new ObjectEvent(event, obj));
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
    let sql = `INSERT INTO ${cls.type} (${columns}) VALUES ( ${values} );`;
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
    let sql = `UPDATE ${cls.type}
      SET ${settings} WHERE id=$id;`;;
    await this.db.run(sql, params);
    let obj = await this.getObject<T>(cls, id);
    this.publishObject('update', obj);
    return obj
  }
  async getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T> {
    let sql = `SELECT *,'${cls.type}' as _type FROM ${cls.type}
    WHERE id=$id`;
    let ret = await this.db.get<T>(sql, {$id: id});
    if (ret === undefined) {
      throw new NotFound(`${cls.type} ${id}`);
    }
    if (cls.fromdb !== undefined) {
      ret = cls.fromdb(ret);
    }
    return ret;
  }
  async listObjects<T extends IObject>(cls: IObjectClass<T>,
      args:{
        where?:string,
        params?:{},
        order?:string[],
        limit?:number,
        offset?:number,
      } = {}):Promise<T[]> {
    let { where, params, order, offset, limit } = <any>(args || {});
    let select = `SELECT *,'${cls.type}' as _type FROM ${cls.type}`;
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
    let limit_clause = '';
    if (limit !== undefined) {
      limit_clause = `LIMIT ${limit}`
    }
    let offset_clause = '';
    if (offset !== undefined) {
      offset_clause = `OFFSET ${offset}`
    }
    let sql = `${select} ${where} ${order_clause} ${limit_clause} ${offset_clause}`;
    let ret = this.db.all<T>(sql, params);
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
  async exec(sql:string):Promise<any> {
    return this.db.exec(sql);
  }
  async deleteObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<any> {
    let obj = await this.getObject<T>(cls, id);
    let sql = `DELETE FROM ${cls.type} WHERE id=$id`;
    await this.db.run(sql, {$id: id});
    this.publishObject('delete', obj);
  }

  async doAction<T>(label:string, func:((...args)=>T|Promise<T>)):Promise<T> {
    return this.undo.doAction(label, func);
  }
}
