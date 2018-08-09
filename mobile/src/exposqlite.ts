import {
  SQLite,
} from 'expo';
import { AsyncRunResult, IAsyncSqlite, ICursor } from 'buckets-core/dist/dbstore'

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

export class ExpoSQLiteCursor implements ICursor {
  constructor(private tx:SQLite.Transaction) {

  }
  async run(query:string, params?:object):Promise<AsyncRunResult> {
    return new Promise<AsyncRunResult>((resolve, reject) => {
      let {sql, args} = sqlo2a(query, params);
      console.log('.run', sql, args);
      this.tx.executeSql(sql, args, (tx, results) => {
        // resolve
        console.log('got result', results);
        resolve({
          lastID: results.insertId,
        })
      })
    })
  }
  async executeMany(queries:string[]):Promise<null> {
    console.log('executeMany', queries.length);
    console.log('queries', queries);
    for (const sql of queries) {
      console.log('Queueing sql', sql);
      this.tx.executeSql(sql, [])
    }
    console.log('done w/ executeMany');
    return null;
  }
  async all<T>(query:string, params?:object):Promise<Array<T>> {
    return new Promise<Array<T>>((resolve, reject) => {
      let {sql, args} = sqlo2a(query, params);
      console.log('ExpoSQLiteCursor.all', sql, args);
      this.tx.executeSql(sql, args, (tx, results) => {
        let rows:T[] = [];
        for (var i = 0; i < results.rows.length; i++) {
          rows.push(results.rows.item(i) as T);
        }
        console.log('result', rows);
        resolve(rows)
      }, (tx, err) => {
        console.log('err', err.toString());
        reject(err)
      })
    })
  }
  async get<T>(query:string, params?:object):Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let {sql, args} = sqlo2a(query, params);
      console.log('.get', sql, args);
      this.tx.executeSql(sql, args, (tx, results) => {
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
  }
}

export class ExpoSQLiteDatabase implements IAsyncSqlite {
  constructor(readonly db:SQLite.Database) {

  }
  async doTransaction<T>(func:(tx:ExpoSQLiteCursor)=>Promise<T>):Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let ret:T;
      this.db.transaction(
        async tx => {
          try {
            ret = await func(new ExpoSQLiteCursor(tx))  
          } catch(err) {
            reject(err);
          }
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
    return this.doTransaction(tx => {
      return tx.run(query, params)
    })
  }
  async executeMany(queries:string[]):Promise<null> {
    return this.doTransaction(tx => {
      return tx.executeMany(queries);
    })
  }
  async all<T>(query:string, params?:object):Promise<Array<T>> {
    return this.doTransaction(tx => {
      return tx.all<T>(query, params);
    })
  }
  async get<T>(query:string, params?:object):Promise<T> {
    return this.doTransaction(tx => {
      return tx.get<T>(query, params);
    })
  }
}

