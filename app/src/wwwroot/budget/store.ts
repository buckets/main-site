import * as Path from 'path'
import * as Rx from 'rxjs/Rx'
import * as sqlite from 'sqlite'
import * as log from 'electron-log'
import {} from 'bluebird'
import {AccountStore} from './models/account'
import {APP_ROOT} from '../../lib/globals'

type DataEventType =
  'update'
  | 'delete';

export interface IObject {
  id:number;
  _type:string;
}

export class DataEvent {
  public event: DataEventType;
  public obj: IObject;
  constructor(event:DataEventType, obj:IObject) {
    this.event = event;
    this.obj = obj;
  }
}

let ALLOWED_RE = /[^a-zA-Z0-9_]+/g
function sanitizeDbFieldName(x) {
  return x.replace(ALLOWED_RE, '')
}


export class Store {
  private filename:string;
  private _db:sqlite.Database;
  public data:Rx.Subject<DataEvent>;

  readonly accounts:AccountStore;
  constructor(filename) {
    this.filename = filename;
    this.data = new Rx.Subject();
    this.accounts = new AccountStore(this);
  }
  async open() {
    this._db = await sqlite.open(this.filename, {promise:Promise})

    // upgrade database
    try {
      await this._db.migrate({
        migrationsPath: Path.join(APP_ROOT, 'migrations'),
      })  
    } catch(err) {
      log.error(err.stack);
      throw err;
    }
  }
  get db():sqlite.Database {
    return this._db;
  }
  publishObject(event:DataEventType, obj:IObject) {
    this.data.next(new DataEvent(event, obj));
  }
  async createObject(tablename:string, data:object):Promise<IObject> {
    let params = {};
    let columns = [];
    let values = [];
    Object.keys(data).forEach(key => {
      let snkey = sanitizeDbFieldName(key);
      columns.push(snkey);
      params['$'+snkey] = data[key];
      values.push('$'+snkey);
    })
    let sql = `INSERT INTO ${tablename} (${columns}) VALUES ( ${values} );`;
    let result = await this.db.run(sql, params);
    let obj = Object.assign({}, data, {
      id: result.lastID,
      _type: tablename,
    });
    this.publishObject('update', obj);
    return obj;
  }
  async getObject<T>(tablename:string, id:number):Promise<T> {
    let sql = `SELECT * FROM ${tablename} WHERE id=$id`;
    let obj = await this.db.get(sql, {$id: id});
    return Object.assign(obj, {_type: tablename});
  }
  async deleteObject(tablename:string, id:number):Promise<any> {
    let obj = await this.getObject<IObject>(tablename, id);
    let sql = `DELETE FROM ${tablename} WHERE id=$id`;
    await this.db.run(sql, {$id: id});
    this.publishObject('delete', obj);
  }
}



