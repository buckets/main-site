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
  async run(query:string, params?:object):Promise<AsyncRunResult> {
    return new Promise<AsyncRunResult>((resolve, reject) => {
      this.db.transaction(tx => {
        let {sql, args} = sqlo2a(query, params);
        tx.executeSql(sql, args, (tx, results) => {
          // resolve
          resolve({
            lastID: results.insertId,
          })
        }, err => {
          reject(err)
        })
      })
    })
  }
  async exec(query:string):Promise<null> {
    return new Promise<null>((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(query, [], results => {
          resolve(null);
        }, err => {
          reject(err);
        })
      })
    })
  }
  async all<T>(query:string, params?:object):Promise<Array<T>> {
    return new Promise<Array<T>>((resolve, reject) => {
      this.db.transaction(tx => {
        let {sql, args} = sqlo2a(query, params);
        tx.executeSql(sql, args, (tx, results) => {
          let rows:T[] = [];
          for (var i = 0; i < results.rows.length; i++) {
            rows.push(results.rows.item(i) as T);
          }
          resolve(rows)
        }, err => {
          reject(err)
        })
      })
    })
  }
  async get<T>(query:string, params?:object):Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.db.transaction(tx => {
        let {sql, args} = sqlo2a(query, params);
        tx.executeSql(sql, args, (tx, results) => {
          // resolve
          if (results.rows.length === 1) {
            resolve(results.rows.item(0))
          } else {
            resolve(null as any);
          }
        }, err => {
          reject(err)
        })
      })
    })
  }
}

