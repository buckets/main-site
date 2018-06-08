// import { EventSource } from '@iffycan/events'
import { IStore, ISubStore, IStoreEvents, EventCollection, IObjectTypes, ObjectEventType, IObject } from './store'
import { createErrorSubclass } from './errors'
import { SubStore } from './models/substore'
import { setupDatabase } from './dbsetup'
import { UndoTracker } from './undo'

export const NotFound = createErrorSubclass('NotFound');

export interface AsyncRunResult {
  lastID: number;
}

/**
 *  This is the interface that needs to be implemented
 *  by an SQLite library in order to be used with SQLiteStore.
 */
export interface IAsyncSqlite {
  run(query:string, params?:object):Promise<AsyncRunResult>;
  exec(query:string):Promise<null>;
  all<T>(query:string, params?:object):Promise<Array<T>>;
  get<T>(query:string, params?:object):Promise<T>;
}

let ALLOWED_RE = /[^a-zA-Z0-9_]+/g
export function sanitizeDbFieldName(x) {
  return x.replace(ALLOWED_RE, '')
}

/**
 *  Implementation of IStore for SQLite databases implementing
 *  the IAsyncSqlite interface.
 */
export class SQLiteStore implements IStore {
  readonly events = new EventCollection<IStoreEvents>();
  readonly sub: ISubStore;
  readonly undo: UndoTracker;

  constructor(readonly db:IAsyncSqlite) {
    this.sub = new SubStore(this);
    this.undo = new UndoTracker(this);
  }

  async doSetup() {
    setupDatabase(this);
  }

  publishObject(event:ObjectEventType, obj:IObject) {
    this.events.broadcast('obj', {
      event,
      obj,
    });
  }

  async createObject<T extends keyof IObjectTypes>(cls:T, data:Partial<IObjectTypes[T]>):Promise<IObjectTypes[T]> {
    let params = {};
    let columns = [];
    let values = [];
    Object.keys(data).forEach(key => {
      let snkey = sanitizeDbFieldName(key);
      columns.push(snkey);
      params['$'+snkey] = data[key];
      values.push('$'+snkey);
    })
    let sql = `INSERT INTO ${cls} (${columns}) VALUES ( ${values} );`;
    let result = await this.db.run(sql, params);
    let obj = await this.getObject(cls, result.lastID);
    this.publishObject('update', obj);
    return obj;
  }
  
  async getObject<T extends keyof IObjectTypes>(cls:T, id:number):Promise<IObjectTypes[T]> {
    let sql = `SELECT *,'${cls}' as _type FROM ${cls}
    WHERE id=$id`;
    let ret = await this.db.get<IObjectTypes[T]>(sql, {$id: id});
    if (ret === undefined) {
      throw new NotFound(`${cls} ${id}`);
    }
    // XXX TODO
    // if (cls.fromdb !== undefined) {
    //   ret = cls.fromdb(ret);
    // }
    return ret;
  }

  async updateObject<T extends keyof IObjectTypes>(cls:T, id:number, data:Partial<IObjectTypes[T]>):Promise<IObjectTypes[T]> {
    let params = {'$id': id};
    let settings = Object.keys(data).map(key => {
      let snkey = sanitizeDbFieldName(key);
      params['$'+snkey] = data[key];
      return `${snkey}=$${snkey}`
    })
    let sql = `UPDATE ${cls}
      SET ${settings} WHERE id=$id;`;;
    await this.db.run(sql, params);
    let obj = await this.getObject<T>(cls, id);
    this.publishObject('update', obj);
    return obj;
  }

  async listObjects<T extends keyof IObjectTypes>(cls:T,
    args?: {
      where?:string,
      params?:{},
      order?:string[],
      limit?:number,
      offset?:number
    }):Promise<IObjectTypes[T][]> {
    let { where, params, order, offset, limit } = <any>(args || {});
    let select = `SELECT *,'${cls}' as _type FROM ${cls}`;
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
    let ret = this.db.all<IObjectTypes[T]>(sql, params);
    
    // XXX TODO
    // if (cls.fromdb) {
    //   ret.then(objects => {
    //     return objects.map(cls.fromdb);
    //   })
    // }
    return ret;
  }

  async deleteObject<T extends keyof IObjectTypes>(cls:T, id:number):Promise<any> {
    let obj = await this.getObject<T>(cls, id);
    let sql = `DELETE FROM ${cls} WHERE id=$id`;
    await this.db.run(sql, {$id: id});
    this.publishObject('delete', obj);
  }

  async query<T>(sql:string, params:{}):Promise<Array<T>> {
    return this.db.all<T>(sql, params);
  }

  async exec(sql:string):Promise<null> {
    return this.db.exec(sql);
  }

  /**
   *  Perform a function that can later be undone.
   */
  async doUndoableAction<T>(label:string, func:((...args)=>T|Promise<T>)):Promise<T> {
    return this.undo.doAction(label, func);
  }
}

