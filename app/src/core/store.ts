import * as Path from 'path'
import * as URL from 'url';
import * as sqlite from 'sqlite'
import * as log from 'electron-log'
import {EventEmitter} from 'events';
import {} from 'bluebird'
import {BucketStore, Bucket, Transaction as BucketTransaction} from './models/bucket';
import {AccountStore, Account, Transaction as AccountTransaction} from './models/account'
import {APP_ROOT} from '../lib/globals'
import {ipcMain, ipcRenderer, webContents} from 'electron';

//--------------------------------------------------------------------------------
// objects
//--------------------------------------------------------------------------------
export interface IObject {
  id:number;
  created: string;
  _type:string;
}
interface IObjectClass<T> {
  new(): T;
  table_name: string;
  fromdb?(obj:T):T;
}
export function isObj<T extends IObject>(cls: IObjectClass<T>, obj: IObject): obj is T {
  return obj._type === cls.table_name;
}
// serializing
// I don't love having to register all classes here...
const OBJECT_CLASSES = [
  Account,
  AccountTransaction,
  Bucket,
  BucketTransaction,
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
  data:DataEventEmitter;
  publishObject(event:ObjectEventType, obj:IObject);
  createObject<T extends IObject>(cls: IObjectClass<T>, data:Partial<T>):Promise<T>;
  updateObject<T extends IObject>(cls: IObjectClass<T>, id:number, data:Partial<T>):Promise<T>;
  getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T>;
  listObjects<T extends IObject>(cls: IObjectClass<T>, args?:{where?:string, params?:{}, order?:string[]}):Promise<T[]>;
  deleteObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<any>;
  query(sql:string, params:{}):Promise<any>;

  // model-specific stuff
  accounts:AccountStore;
  buckets:BucketStore;
}

//--------------------------------------------------------------------------------
// DataEvents
//--------------------------------------------------------------------------------
type ObjectEventType =
  'update'
  | 'delete';

export class ObjectEvent<T extends IObject> {
  public event: ObjectEventType;
  public obj: T;
  constructor(event:ObjectEventType, obj:T) {
    this.event = event;
    this.obj = obj;
  }
}
class DataEventEmitter extends EventEmitter {
  emit(event: 'obj', obj:ObjectEvent<any>):boolean;
  emit(event, obj):boolean {
    return super.emit(event, obj);
  }
  on(event: 'obj', listener: (obj:ObjectEvent<any>) => void):this;
  on(event, listener):this {
    return super.on(event, listener);
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
  public data:DataEventEmitter;

  readonly accounts:AccountStore;
  readonly buckets:BucketStore;
  constructor(private filename:string) {
    this.data = new DataEventEmitter();
    this.accounts = new AccountStore(this);
    this.buckets = new BucketStore(this);
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
  publishObject(event:ObjectEventType, obj:IObject) {
    this.data.emit('obj', new ObjectEvent(event, obj));
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
  async updateObject<T extends IObject>(cls: IObjectClass<T>, id:number, data:Partial<T>):Promise<T> {
    let params = {'$id': id};
    let settings = Object.keys(data).map(key => {
      let snkey = sanitizeDbFieldName(key);
      params['$'+snkey] = (<T>data)[key];
      return `${snkey}=$${snkey}`
    })
    let sql = `UPDATE ${cls.table_name}
      SET ${settings} WHERE id=$id;`;;
    await this.db.run(sql, params);
    let obj = await this.getObject<T>(cls, id);
    this.publishObject('update', obj);
    return obj
  }
  async getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T> {
    let sql = `SELECT *,'${cls.table_name}' as _type FROM ${cls.table_name}
    WHERE id=$id`;
    let ret = this.db.get(sql, {$id: id});
    if (cls.fromdb !== undefined) {
      ret.then(cls.fromdb);
    }
    return ret;
  }
  async listObjects<T extends IObject>(cls: IObjectClass<T>, args?:{where?:string, params?:{}, order?:string[]}):Promise<T[]> {
    let { where, params, order } = <any>(args || {});
    let select = `SELECT *,'${cls.table_name}' as _type FROM ${cls.table_name}`;
    if (where) {
      where = `WHERE ${where}`;
    }
    if (!params) {
      params = {};
    }
    let order_clause = 'ORDER BY id';
    if (order && order.length) {
      order_clause = `ORDER BY ${order.join(',')}`;
    }
    let sql = `${select} ${where} ${order_clause}`;
    let ret = this.db.all(sql, params);
    if (cls.fromdb) {
      ret.then(objects => {
        return objects.map(cls.fromdb);
      })
    }
    return ret;
  }
  async query(sql:string, params:{}):Promise<any> {
    return this.db.all(sql, params);
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
  private data:DataEventEmitter;
  constructor(private store:IStore, private room:string) {
  }
  get channel() {
    return `rpc-${this.room}`;
  }
  start() {
    this.data = this.store.data.on('obj', (value) => {
      // probably not efficient if you have two different files open...
      // but... that's an edge case, and still probably plenty fast
      webContents.getAllWebContents().forEach(wc => {
        if (URL.parse(wc.getURL()).hostname === this.room) {
          let ch = `data-${this.room}`;
          wc.send(ch, value);
        }
      })
    });
    ipcMain.on(this.channel, this.gotMessage);
  }
  stop() {
    ipcMain.removeListener(this.channel, this.gotMessage);
  }
  gotMessage = async (event, message:RPCMessage) => {
    // log.debug('MAIN RPC', message);
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
  public data:DataEventEmitter;
  readonly accounts:AccountStore;
  readonly buckets:BucketStore;
  constructor(private room:string) {
    this.data = new DataEventEmitter();
    ipcRenderer.on(`data-${room}`, this.dataReceived.bind(this));
    this.accounts = new AccountStore(this);
    this.buckets = new BucketStore(this);
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
    // log.debug('CLIENT CALL', msg);
    return new Promise((resolve, reject) => {
      ipcRenderer.once(`rpc-reply-${msg.id}`, (event, reply:RPCReply) => {
        // log.debug('CLIENT RECV', reply);
        if (reply.ok) {
          resolve(reply.value);
        } else {
          reject(reply.value);
        }
      });
      ipcRenderer.send(this.channel, msg);
    })
  }
  dataReceived(event, message:ObjectEvent<any>) {
    this.data.emit('obj', message);
  }

  // IStore methods
  publishObject(event:ObjectEventType, obj:IObject) {
    return this.callRemote('publishObject', event, obj);
  }
  createObject<T extends IObject>(cls: IObjectClass<T>, data:Partial<T>):Promise<T> {
    return this.callRemote('createObject', serializeObjectClass(cls), data);
  }
  updateObject<T extends IObject>(cls: IObjectClass<T>, id:number, data:Partial<T>):Promise<T> {
    return this.callRemote('updateObject', serializeObjectClass(cls), id, data);
  }
  getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T> {
    return this.callRemote('getObject', serializeObjectClass(cls), id);
  }
  listObjects<T extends IObject>(cls: IObjectClass<T>, ...args):Promise<T[]> {
    return this.callRemote('listObjects', serializeObjectClass(cls), ...args);
  }
  query(sql:string, params:{}):Promise<any> {
    return this.callRemote('query', sql, params);
  }
  deleteObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<any> {
    return this.callRemote('deleteObject', serializeObjectClass(cls), id);
  }
}


