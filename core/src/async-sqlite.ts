import { AsyncRunResult, IAsyncSqlite, ICursor } from './dbstore'
//=============================================================
// DUPLICATE of app/src/async-sqlite.ts
//
// XXX TODO Make it into a separate module
//
//=============================================================
import * as sqlite3 from 'sqlite3'
export function openSqlite(filename:string) {
  return new NodeSQLiteDatabase(new sqlite3.Database(filename))
}
export class NodeSQLiteCursor implements ICursor {
  constructor(readonly db:sqlite3.Database) {

  }
  async run(query:string, params={}):Promise<AsyncRunResult> {
    return new Promise<AsyncRunResult>((resolve, reject) => {
      this.db.run(query, params, function callback(err) {
        if (err) {
          reject(err);
        } else {
          const result:AsyncRunResult = {
            lastID: this.lastID,
          }
          resolve(result);
        }
      })
    })
  }
  async executeMany(queries:string[]):Promise<null> {
    return new Promise<null>((resolve, reject) => {
      this.db.exec(queries.join(';'), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(null);
        }
      })
    })
  }
  async all<T>(query:string, params={}):Promise<Array<T>> {
    return new Promise<Array<T>>((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      })
    });
  }
  async get<T>(query:string, params={}):Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      })
    })
  }
}

export class NodeSQLiteDatabase implements IAsyncSqlite {
  private cursor:NodeSQLiteCursor;
  constructor(readonly db:sqlite3.Database) {
    this.cursor = new NodeSQLiteCursor(db);
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