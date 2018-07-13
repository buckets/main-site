import {
  SQLite,
} from 'expo';
import { AsyncRunResult, IAsyncSqlite } from 'buckets-core/dist/dbstore'

// await new Promise<any>((resolve, reject) => {
//     db.transaction(tx => {
//       tx.executeSql(
//         'select sqlite_version() as theversion',
//         [],
//         (_, result) => {
//           console.log('result', result);
//           console.log('rows', result.rows._array);
//           resolve(null);
//         }
//       )
//     })
//   })

export function sqlo2a(query:string, params?:object):{sql:string, args:any[]} {
  if (params === undefined) {
    return {sql: query, args: []}
  }
  const varnames = Object.keys(params)
  .sort((a,b) => {
    if (a.length > b.length) {
      return -1
    } else if (a.length === b.length) {
      return 0
    } else {
      return 1
    }
  })
  .map(x => `[$]${x.substr(1)}`)
  let regex = new RegExp('(' + varnames.join('|') + ')')
  let parts = query.split(regex);
  let args:any[] = [];
  let new_parts = parts.map(part => {
    if (part.startsWith('$')) {
      // variable, probably :)
      args.push(params[part]);
      return '?'
    } else {
      // normal string
      return part
    }
  })
  return {
    sql: new_parts.join(''),
    args: args,
  }
}

export class WebSQLDatabase implements IAsyncSqlite {
  constructor(readonly db:SQLite.Database) {

  }
  private _run<T>(func:(tx:SQLite.Transaction)=>Promise<T>):Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let ret:T;
      this.db.transaction(
        async tx => {
          ret = await func(tx)
        },
        err => {
          reject(err)
        },
        () => {
          resolve(ret)
        })
    })
  }
  async run(query:string, params?:object):Promise<AsyncRunResult> {
    return this._run(tx => {
      return new Promise<AsyncRunResult>((resolve, reject) => {
        let {sql, args} = sqlo2a(query, params);
        console.log('.run', sql, args);
        tx.executeSql(sql, args, (tx, results) => {
          // resolve
          console.log('got result', results);
          resolve({
            lastID: results.insertId,
          })
        })
      })
    })
    // return new Promise<AsyncRunResult>((resolve, reject) => {
    //   this.db.transaction(tx => {
    //     let {sql, args} = sqlo2a(query, params);
    //     tx.executeSql(sql, args, (tx, results) => {
    //       // resolve
    //       resolve({
    //         lastID: results.insertId,
    //       })
    //     }, (tx, err) => {
    //       reject(err)
    //     })
    //   })
    // })
  }
  async executeMany(queries:string[]):Promise<null> {
    console.log('executeMany', queries.length);
    console.log('queries', queries);
    await new Promise<null>((resolve, reject) => {
      this.db.transaction(tx => {
        for (const sql of queries) {
          console.log('Queueing sql', sql);
          tx.executeSql(sql, [])
        }
      },
      err => {
        console.log('transaction err');
        reject(err)
      },
      () => {
        console.log('transaction done');
        resolve(null)
      })
    })
    console.log('done w/ executeMany');
    return null;
    // return this._run(tx => {
    //   return new Promise<null>((resolve, reject) => {
        
    //     tx.executeSql(query, [], results => {
    //       resolve(null);
    //     })
    //   })
    // })
    // return new Promise<null>((resolve, reject) => {
    //   this.db.transaction(tx => {
    //     console.log("Executing SQL:", query);
    //     tx.executeSql(query, [], results => {
    //       console.log("GOT Results");
    //       resolve(null);
    //     }, (tx, err) => {
    //       console.log("Error", JSON.stringify(err));
    //       reject(err);
    //     })
    //   })
    // })
  }
  async all<T>(query:string, params?:object):Promise<Array<T>> {
    return new Promise<Array<T>>((resolve, reject) => {
      this.db.transaction(tx => {
        let {sql, args} = sqlo2a(query, params);
        console.log('.all', sql, args);
        tx.executeSql(sql, args, (tx, results) => {
          let rows:T[] = [];
          for (var i = 0; i < results.rows.length; i++) {
            rows.push(results.rows.item(i) as T);
          }
          resolve(rows)
        }, (tx, err) => {
          reject(err)
        })
      })
    })
  }
  async get<T>(query:string, params?:object):Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.db.transaction(tx => {
        let {sql, args} = sqlo2a(query, params);
        console.log('.get', sql, args);
        tx.executeSql(sql, args, (tx, results) => {
          // resolve
          if (results.rows.length === 1) {
            resolve(results.rows.item(0))
          } else {
            resolve(null as any);
          }
        }, (tx, err) => {
          reject(err)
        })
      })
    })
  }
}

