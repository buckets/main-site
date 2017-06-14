import * as Rx from 'rxjs/Rx';
import * as sqlite from 'sqlite';
import {} from 'bluebird';
import {AccountStore} from './models/account';

console.log('hello?');

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
  public data:Rx.Observable<DataEvent>;

  readonly accounts:AccountStore;
  constructor(filename) {
    this.filename = filename;
    this.data = new Rx.Subject();
    this.accounts = new AccountStore(this);
  }
  async open() {
    this._db = await sqlite.open(this.filename, {promise:Promise})
  }
  get db():sqlite.Database {
    return this._db;
  }
  async createObject(tablename:string, data:object):Promise<IObject> {
    let keys = Object.keys(data).map(sanitizeDbFieldName);
    let columns = keys.join(',');
    let values = keys.map(n => '$'+n).join(',');
    let sql = `INSET INTO ${tablename} (${columns}) VALUES (${values})`;
    console.log('sql', sql);
    // this.db.run(`INSERT INTO ${tablename} VALUES`,
    //   )
    return {
      id: 10,
      _type: 'foobar',
    }
  }
  async getObject(tablename:string, id:number):Promise<IObject> {
    return {
      id: 12,
      _type: 'gumption',
    }
  }
}



