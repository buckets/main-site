import { v4 as uuid } from 'uuid';
import { IStore, IBudgetBus, TABLE2CLASS, IObject, IObjectClass, ObjectEventType} from './store'
import { ipcMain, ipcRenderer } from 'electron'
import { BucketStore } from './models/bucket'
import { AccountStore } from './models/account'
import { SimpleFINStore } from './models/simplefin'
import { ReportStore } from './models/reports'
import { BankMacroStore } from './models/bankmacro'
import { PrefixLogger } from './logging'

const log = new PrefixLogger('(rpcstore)')

//--------------------------------------------------------------------------------
// serializing
//--------------------------------------------------------------------------------
interface SerializedObjectClass {
  _buckets_serialized_object_class: string;
}
function isSerializedObjectClass(obj): obj is SerializedObjectClass {
  return obj !== null && (<any>obj)._buckets_serialized_object_class !== undefined;
}
function serializeObjectClass<T extends IObject>(cls:IObjectClass<T>):SerializedObjectClass {
  return {
    _buckets_serialized_object_class: cls.type,
  }
}
function deserializeObjectClass<T extends IObject>(obj:SerializedObjectClass):IObjectClass<T> {
  return TABLE2CLASS[obj._buckets_serialized_object_class]
}

//---------------------------------------------------------------------------
// Generic RPC classes
//---------------------------------------------------------------------------
interface RPCMessage<T> {
  reply_ch: string;
  method: keyof T;
  params: Array<any>;
}
interface RPCReply {
  result?: any;
  error?: Error;
}
/**
 *  Generic RPC call receiver (for main process)
 */
export class RPCReceiver<T> {
  constructor(private channel:string, private obj:T) {
  }
  start() {
    ipcMain.on(this.channel, this.gotMessage);
  }
  stop() {
    ipcMain.removeListener(this.channel, this.gotMessage);
  }
  gotMessage = async (event, message:RPCMessage<T>) => {
    // log.debug('MAIN RPC', message);
    try {
      // convert args to classes
      let args = message.params.map(arg => {
        return isSerializedObjectClass(arg) ? deserializeObjectClass(arg) : arg;
      })
      let value = this.obj[message.method];
      if (value instanceof Function) {
        let result = await value.bind(this.obj)(...args);
        let reply:RPCReply = {result}
        event.sender.send(message.reply_ch, reply);  
      } else {
        throw new Error(`Not a function: ${message.method}`);
      }
    } catch(err) {
      log.error('RPC error', err);
      let reply:RPCReply = {error: err}
      event.sender.send(message.reply_ch, reply)
    }
  }
}
/**
 *  Generic RPC call maker (for renderer process)
 */ 
export class RPCCaller<T> {
  private next_msg_id = 1;
  constructor(private channel:string) {}
  async callRemote<K>(method:keyof T, ...args):Promise<K> {
    let msg:RPCMessage<T> = {
      reply_ch: `rpc-reply-${this.next_msg_id++}-${uuid()}`,
      method: method,
      params: args,
    }
    return new Promise<K>((resolve, reject) => {
      ipcRenderer.once(msg.reply_ch, (event, {result, error}:RPCReply) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as K);
        }
      });
      ipcRenderer.send(this.channel, msg);
    })
  }
}


//---------------------------------------------------------------------------
// RPC Store pairs for bridging main and renderer
//---------------------------------------------------------------------------
/**
  
 */
export class RPCMainStore {
  private receiver:RPCReceiver<IStore>;
  constructor(store:IStore, room:string) {
    this.receiver = new RPCReceiver(`rpc-store-${room}`, store);
  }
  start() {
    this.receiver.start();
  }
  stop() {
    this.receiver.stop();
  }
}
export class RPCRendererStore implements IStore {
  readonly accounts:AccountStore;
  readonly buckets:BucketStore;
  readonly simplefin:SimpleFINStore;
  readonly reports:ReportStore;
  readonly bankmacro:BankMacroStore;
  private caller:RPCCaller<IStore>;
  constructor(room:string, readonly bus:IBudgetBus) {
    this.accounts = new AccountStore(this);
    this.buckets = new BucketStore(this);
    this.simplefin = new SimpleFINStore(this);
    this.reports = new ReportStore(this);
    this.bankmacro = new BankMacroStore(this);
    this.caller = new RPCCaller(`rpc-store-${room}`);
  }
  async callRemote<T>(method, ...args):Promise<T> {
    return this.caller.callRemote<T>(method, ...args);
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

