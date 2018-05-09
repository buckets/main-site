import * as sqlite3 from 'sqlite3-offline'

interface RunResult {
  lastID: number;
}

export class AsyncDatabase {
  constructor(readonly db:sqlite3.Database) {

  }
  async run(query:string, params={}):Promise<RunResult> {
    return new Promise<RunResult>((resolve, reject) => {
      this.db.run(query, params, function callback(err) {
        if (err) {
          reject(err);
        } else {
          const result:RunResult = {
            lastID: this.lastID,
          }
          resolve(result);
        }
      })
    })
  }
  async exec(query:string):Promise<null> {
    return new Promise<null>((resolve, reject) => {
      this.db.exec(query, (err) => {
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