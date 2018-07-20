import * as sqlite3 from 'sqlite3-offline'
import { AsyncRunResult, IAsyncSqlite } from 'buckets-core/dist/dbstore'

export function openSqlite(filename:string) {
  return new AsyncDatabase(new sqlite3.Database(filename))
}

export class AsyncDatabase implements IAsyncSqlite {
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
  async executeMany(sqls:string[]):Promise<null> {
    return new Promise<null>((resolve, reject) => {
      this.db.exec(sqls.join(';'), (err) => {
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