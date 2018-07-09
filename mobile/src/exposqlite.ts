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

function interpolateValues(query:string, params:object):string {
  // XXX I don't like that I'm doing this.
  for (const key of Object.keys(params)) {
    const val = params[key];
    const rkey = '$' + key;

  }
}

export class WebSQLDatabase implements IAsyncSqlite {
  constructor(readonly db:SQLite.Database) {

  }
  async run(query:string, params?:object):Promise<AsyncRunResult> {
    return new Promise<AsyncRunResult>((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(query, params)
      })
    })
  }
  async exec(query:string):Promise<null> {

  }
  async all<T>(query:string, params?:object):Promise<Array<T>> {

  }
  async get<T>(query:string, params?:object):Promise<T> {

  }
}