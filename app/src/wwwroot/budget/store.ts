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
  created: Date;
  _type:string;
}
interface IObjectClass<T> {
  new(): T;
  table_name: string;
}
// Return whether an object is an X
export function isObj<T extends IObject>(cls: IObjectClass<T>, obj: IObject): obj is T {
  return obj._type === cls.table_name;
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
  private _db:sqlite.Database;
  public data:Rx.Subject<DataEvent>;

  readonly accounts:AccountStore;
  constructor(private filename:string) {
    this.data = new Rx.Subject();
    this.accounts = new AccountStore(this);
  }
  async open():Promise<Store> {
    console.log('opening database', this.filename);
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
    return this;
  }
  get db():sqlite.Database {
    return this._db;
  }
  publishObject(event:DataEventType, obj:IObject) {
    this.data.next(new DataEvent(event, obj));
  }
  async createObject<T extends IObject>(cls: IObjectClass<T>, data:Partial<T>):Promise<T> {
    let params = {};
    let columns = [];
    let values = [];
    Object.keys(data).forEach(key => {
      let snkey = sanitizeDbFieldName(key);
      columns.push(snkey);
      params['$'+snkey] = (<T>data)[key];
      values.push('$'+snkey);
    })
    let sql = `INSERT INTO ${cls.table_name} (${columns}) VALUES ( ${values} );`;
    let result = await this.db.run(sql, params);
    let obj = <T>Object.assign({}, data, {
      id: result.lastID,
      _type: cls.table_name,
    });
    this.publishObject('update', obj);
    return obj;
  }
  async getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T> {
    let sql = `SELECT *,'${cls.table_name}' as _type FROM ${cls.table_name} WHERE id=$id`;
    return this.db.get(sql, {$id: id});
  }
  async deleteObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<any> {
    let obj = await this.getObject<T>(cls, id);
    let sql = `DELETE FROM ${cls.table_name} WHERE id=$id`;
    await this.db.run(sql, {$id: id});
    this.publishObject('delete', obj);
  }
}



