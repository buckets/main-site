import { AsyncRunResult, IAsyncSqlite, ICursor } from './dbstore'
//=============================================================
// DUPLICATE of app/src/async-sqlite.ts
//
// XXX TODO Make it into a separate module
//
//=============================================================
import * as bucketslib from 'bucketslib'
bucketslib.main.register_logger((msg:string) => {
  console.log("FROM bucketslib:", msg);
});

export function openSqlite(filename:string) {
  return new NodeSQLiteDatabase(bucketslib.main.openfile(filename));
}
export class NodeSQLiteCursor implements ICursor {
  constructor(readonly db_id:number) {

  }
  private convertToArray(query:string, params:{}):{query:string, params:Array<string>} {
    let indexes = bucketslib.db_paramArray(this.db_id, query);
    let param_array = indexes.map(name => {
      return `${params[name]}`;
    });
    return {query: query, params: param_array};
  }
  async run(query:string, params={}):Promise<AsyncRunResult> {
    console.log("RUN", query, params);
    return new Promise<AsyncRunResult>((resolve, reject) => {
      try {
        let conv = this.convertToArray(query, params);
        console.log("conv", conv);
        const lastID = bucketslib.db_run(this.db_id, conv.query, conv.params);
        resolve({
          lastID,
        })
      } catch(err) {
        reject(err);
      }
    })
    .then(res => {
      console.log("result", res);
      return res;
    })
  }
  async executeMany(queries:string[]):Promise<null> {
    return new Promise<null>((resolve, reject) => {
      try {
        bucketslib.db_executeMany(this.db_id, queries);
        resolve(null);
      } catch(err) {
        reject(err);
      }
    })
  }
  async all<T>(query:string, params={}):Promise<Array<T>> {
    console.log("ALL", query, params);
    return new Promise<Array<T>>((resolve, reject) => {
      try {
        let conv = this.convertToArray(query, params);
        console.log("conv", conv);
        const {rows, cols, types} = bucketslib.db_all(this.db_id, conv.query, conv.params);
        let converters = types.map(typename => {
          switch (typename) {
            case "Int":
            case "Float": {
              return (x:string) => Number(x);
            }
            case "Null": {
              return (x:string) => x;
            }
            default: {
              return (x:string) => x;
            }
          }
        })
        resolve(rows.map(row => {
          let ret = {};
          cols.forEach((col, idx) => {
            ret[col] = converters[idx](row[idx]);
          })
          return ret as T;
        }))
      } catch(err) {
        reject(err);
      }
    })
    .then(res => {
      console.log("result", res);
      return res;
    });
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