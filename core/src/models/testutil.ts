import { setBaseLogger, ILogger } from '../logging'
export class QuietLogger implements ILogger {
  info(...args) {

  }
  warn(...args) {
    console.warn(...args);
  }
  error(...args) {
    console.error(...args);
  }
}
setBaseLogger(new QuietLogger());


import * as sqlite3 from 'sqlite3-offline'
import { IObjectEvent, IUserInterfaceFunctions } from '../store'
import { SQLiteStore, AsyncRunResult, IAsyncSqlite } from '../dbstore'


export class TestUIFunctions implements IUserInterfaceFunctions {
  attachStore(store) {

  }
  async openBankMacroBrowser():Promise<any> {
    return null;
  }
  async promptToStartYNABImport():Promise<any> {
    return null;
  }
  async getPassword():Promise<string> {
    return 'password';
  }
}



export async function getStore():Promise<{
  store:SQLiteStore,
  events:IObjectEvent[],
  ui:TestUIFunctions,
}> {
  const ui = new TestUIFunctions();
  const store = new SQLiteStore(openSqlite(':memory:'), ui);
  let events = [];
  await store.doSetup();
  store.events.get('obj').on(message => {
    events.push(message as IObjectEvent);
  })
  return {store, events, ui}
}

// THIS IS COPIED FROM app/src/async-sqlite.ts
// XXX Make it into a separate module
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