import * as log from 'electron-log'
import * as URL from 'url'
import {IStore, DataEventEmitter, IObject, IObjectClass, ObjectEvent, ObjectEventType} from './store'
import {ipcMain, ipcRenderer, webContents} from 'electron'
import {BucketStore, Group, Bucket, Transaction as BucketTransaction} from './models/bucket'
import {AccountStore, Account, Transaction as AccountTransaction} from './models/account'

//--------------------------------------------------------------------------------
// serializing
//--------------------------------------------------------------------------------
// I don't love having to register all classes here...
const OBJECT_CLASSES = [
  Account,
  AccountTransaction,
  Bucket,
  BucketTransaction,
  Group,
]
let TABLE2CLASS = {};
OBJECT_CLASSES.forEach(cls => {
  TABLE2CLASS[cls.table_name] = cls;
})
interface SerializedObjectClass {
  _buckets_serialized_object_class: string;
}
function isSerializedObjectClass(obj): obj is SerializedObjectClass {
  return obj !== null && (<any>obj)._buckets_serialized_object_class !== undefined;
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
    // console.trace();
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


