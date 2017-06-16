import * as Path from 'path'
import * as URL from 'url';
import * as Rx from 'rxjs/Rx'
import * as sqlite from 'sqlite'
import * as log from 'electron-log'
import {} from 'bluebird'
import {AccountStore, Account, Transaction as AccountTransaction} from './models/account'
import {APP_ROOT} from '../lib/globals'
import {ipcMain, ipcRenderer, webContents} from 'electron';

type DataEventType =
  'update'
  | 'delete';


//--------------------------------------------------------------------------------
// objects
//--------------------------------------------------------------------------------
export interface IObject {
  id:number;
  created: Date;
  _type:string;
}
interface IObjectClass<T> {
  new(): T;
  table_name: string;
}
export function isObj<T extends IObject>(cls: IObjectClass<T>, obj: IObject): obj is T {
  return obj._type === cls.table_name;
}
// serializing
// I don't love having to register all classes here...
const OBJECT_CLASSES = [
  Account,
  AccountTransaction,
]
let TABLE2CLASS = {};
OBJECT_CLASSES.forEach(cls => {
  TABLE2CLASS[cls.table_name] = cls;
})
interface SerializedObjectClass {
  _buckets_serialized_object_class: string;
}
function isSerializedObjectClass(obj): obj is SerializedObjectClass {
  return (<any>obj)._buckets_serialized_object_class !== undefined;
}
function serializeObjectClass<T extends IObject>(cls:IObjectClass<T>):SerializedObjectClass {
  return {
    _buckets_serialized_object_class: cls.table_name,
  }
}
function deserializeObjectClass<T extends IObject>(obj:SerializedObjectClass):IObjectClass<T> {
  return TABLE2CLASS[obj._buckets_serialized_object_class]
}

//--------------------------------------------------------------------------------
// Store interface used in both main and renderer processes
//--------------------------------------------------------------------------------
export interface IStore {
  data:Rx.Subject<DataEvent>;
  publishObject(event:DataEventType, obj:IObject);
  createObject<T extends IObject>(cls: IObjectClass<T>, data:Partial<T>):Promise<T>;
  getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T>;
  deleteObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<any>;
}

//--------------------------------------------------------------------------------
// DataEvents
//--------------------------------------------------------------------------------
export class DataEvent {
  public event: DataEventType;
  public obj: IObject;
  constructor(event:DataEventType, obj:IObject) {
    this.event = event;
    this.obj = obj;
  }
}



//--------------------------------------------------------------------------------
// DBStore
// The IStore for the main process
//--------------------------------------------------------------------------------
let ALLOWED_RE = /[^a-zA-Z0-9_]+/g
function sanitizeDbFieldName(x) {
  return x.replace(ALLOWED_RE, '')
}
export class DBStore implements IStore {
  private _db:sqlite.Database;
  public data:Rx.Subject<DataEvent>;

  readonly accounts:AccountStore;
  constructor(private filename:string) {
    this.data = new Rx.Subject();
    this.accounts = new AccountStore(this);
  }
  async open():Promise<DBStore> {
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
    let obj = await this.getObject(cls, result.lastID);
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


//--------------------------------------------------------------------------------
// RPC Store pairs for bridging main and renderer
//--------------------------------------------------------------------------------
interface RPCMessage {
  id: string;
  method: string;
  params: Array<any>;
}
interface RPCReply {
  ok: boolean;
  value: any;
}
export class RPCMainStore {
  private subscription:Rx.Subscription;
  constructor(private store:IStore, private room:string) {
  }
  get channel() {
    return `rpc-${this.room}`;
  }
  start() {
    this.subscription = this.store.data.subscribe({
      next: (value) => {
        // probably not efficient if you have two different files open...
        // but... that's an edge case, and still probably plenty fast
        webContents.getAllWebContents().forEach(wc => {
          if (URL.parse(wc.getURL()).hostname === this.room) {
            wc.send(`data-${this.room}`, value);
          }
        })
      }
    })
    ipcMain.on(this.channel, this.gotMessage);
  }
  stop() {
    ipcMain.removeListener(this.channel, this.gotMessage);
  }
  gotMessage = async (event, message:RPCMessage) => {
    log.debug('MAIN RPC', message);
    try {
      // convert args to classes
      let args = message.params.map(arg => {
        return isSerializedObjectClass(arg) ? deserializeObjectClass(arg) : arg;
      })
      let retval = await this.store[message.method](...args);
      event.sender.send(`rpc-reply-${message.id}`, {
        ok: true,
        value: retval,
      });
    } catch(err) {
      log.error('RPC error', err);
      event.sender.send(`rpc-reply-${message.id}`, {
        ok: false,
        value: err,
      })
    }
  }
}
export class RPCRendererStore implements IStore {
  private next_msg_id:number = 1;
  public data:Rx.Subject<DataEvent>;
  constructor(private room:string) {
    this.data = new Rx.Subject<DataEvent>();
    ipcRenderer.on(`data-${room}`, this.dataReceived);
  }
  get channel() {
    return `rpc-${this.room}`;
  }
  async callRemote(method, ...args) {
    let msg:RPCMessage = {
      id: '' + this.next_msg_id++,
      method: method,
      params: args,
    }
    log.debug('CLIENT CALL', msg);
    return new Promise((resolve, reject) => {
      ipcRenderer.once(`rpc-reply-${msg.id}`, (event, reply:RPCReply) => {
        log.debug('CLIENT RECV', reply);
        if (reply.ok) {
          resolve(reply.value);
        } else {
          reject(reply.value);
        }
      });
      ipcRenderer.send(this.channel, msg);
    })
  }
  dataReceived(event, message:DataEvent) {
    log.debug('dataReceived', event, message);
    this.data.next(message);
  }

  // IStore methods
  publishObject(event:DataEventType, obj:IObject) {
    return this.callRemote('publishObject', event, obj);
  }
  createObject<T extends IObject>(cls: IObjectClass<T>, data:Partial<T>):Promise<T> {
    return this.callRemote('createObject', serializeObjectClass(cls), data);
  }
  getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T> {
    return this.callRemote('getObject', serializeObjectClass(cls), id);
  }
  deleteObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<any> {
    return this.callRemote('deleteObject', serializeObjectClass(cls), id);
  }
}


