import { AsyncRunResult, IAsyncSqlite, ICursor } from './dbstore'
//=============================================================
// DUPLICATE of app/src/async-sqlite.ts
//
// XXX TODO Make it into a separate module
//
//=============================================================
import * as bucketslib from 'bucketslib'

export function openSqlite(filename:string) {
  return new NodeSQLiteDatabase(bucketslib.openfile(filename));
}
export class NodeSQLiteCursor implements ICursor {
  constructor(readonly db_id:number) {

  }
  async run(query:string, params={}):Promise<AsyncRunResult> {
    const lastID = await bucketslib.db_run(this.db_id, query, params);
    return {
      lastID,
    }
  }
  async executeMany(queries:string[]):Promise<null> {
    await bucketslib.db_executeMany(this.db_id, queries);
    return null;
  }
  async all<T>(query:string, params={}):Promise<Array<T>> {
    return await bucketslib.db_all<T>(this.db_id, query, params) as T[];
  }
  get<T>(query:string, params={}):Promise<T> {
    return this.all<T>(query, params).then(rows => {
      if (rows.length) {
        return rows[0] as T;
      } else {
        return null;
      }
    });
  }
}

export class NodeSQLiteDatabase implements IAsyncSqlite {
  private cursor:NodeSQLiteCursor;
  constructor(readonly db_id:number) {
    this.cursor = new NodeSQLiteCursor(db_id);
  }
  async run(query:string, params={}):Promise<AsyncRunResult> {
    return this.cursor.run(query, params)
  }
  async executeMany(queries:string[]):Promise<null> {
    return this.cursor.executeMany(queries);
  }
  async all<T>(query:string, params={}):Promise<Array<T>> {
    return this.cursor.all<T>(query, params);
  }
  async get<T>(query:string, params={}):Promise<T> {
    return this.cursor.get<T>(query, params);
  }
  async doTransaction<T>(func:(tx:NodeSQLiteCursor)=>Promise<T>):Promise<T> {
    await this.cursor.run('BEGIN EXCLUSIVE TRANSACTION')
    try {
      let result = await func(this.cursor);
      await this.cursor.run('COMMIT');
      return result;
    } catch(err) {
      await this.cursor.run('ROLLBACK');
      throw err;
    }
  }
}