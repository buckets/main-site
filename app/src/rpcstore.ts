import { v4 as uuid } from 'uuid';
// import { IStore, IBudgetBus, TABLE2CLASS, IObject, IObjectClass, ObjectEventType} from './store'
import { IStore, IStoreEvents, IEventCollection, ObjectEventType, IObject, IObjectTypes } from 'buckets-core/dist/store'
import { SubStore } from 'buckets-core/dist/models/substore'
import { ipcMain, ipcRenderer } from 'electron'
// import { SubStore } from './models/storebase'
import { PrefixLogger } from './logging'
import { MainEventCollection, RendererEventCollection } from './rpc'

const log = new PrefixLogger('(rpcstore)')


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
      let args = message.params;
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
 *  Main process Store wrapper.  This doesn't implement IStore; it just provides
 *  the things needed by the RPCRendererStore
 */
export class RPCMainStoreHookup {
  private receiver:RPCReceiver<IStore>;
  // private events:IEventCollection<IStoreEvents>;

  constructor(store:IStore, room:string) {
    this.receiver = new RPCReceiver(`rpc-store-${room}`, store);
    new MainEventCollection(store.events, room);
    // XXX Maybe should have a way to turn this on/off
  }
  start() {
    this.receiver.start();
  }
  stop() {
    this.receiver.stop();
  }
}

/**
 *  Renderer process IStore which sends all requests to the main process to
 *  actually be run.
 */
export class RPCRendererStore implements IStore {
  
  readonly sub:SubStore;
  readonly events:IEventCollection<IStoreEvents>;

  private caller:RPCCaller<IStore>;
  
  constructor(room:string) {
    this.sub = new SubStore(this);
    this.caller = new RPCCaller(`rpc-store-${room}`);
    this.events = new RendererEventCollection<IStoreEvents>(room);
  }
  async callRemote<T>(method:keyof IStore, ...args):Promise<T> {
    return this.caller.callRemote<T>(method, ...args);
  }

  // IStore methods
  publishObject(event:ObjectEventType, obj:IObject) {
    this.events.broadcast('obj', {
      event,
      obj,
    });
    return this.callRemote('publishObject', event, obj);
  }
  createObject<T extends keyof IObjectTypes>(cls:T, data:Partial<IObjectTypes[T]>):Promise<IObjectTypes[T]> {
    return this.callRemote('createObject', cls, data);
  }
  updateObject<T extends keyof IObjectTypes>(cls:T, id:number, data:Partial<IObjectTypes[T]>):Promise<IObjectTypes[T]> {
    return this.callRemote('updateObject', cls, id, data);
  }
  getObject<T extends keyof IObjectTypes>(cls:T, id:number):Promise<IObjectTypes[T]> {
    return this.callRemote('getObject', cls, id);
  }
  listObjects<T extends keyof IObjectTypes>(cls:T, ...args):Promise<IObjectTypes[T][]> {
    return this.callRemote('listObjects', cls, ...args);
  }
  query<T>(sql:string, params:{}):Promise<Array<T>> {
    return this.callRemote('query', sql, params);
  }
  exec(sql:string):Promise<null> {
    return this.callRemote('exec', sql);
  }
  deleteObject<T extends keyof IObjectTypes>(cls:T, id:number):Promise<any> {
    return this.callRemote('deleteObject', cls, id);
  }
}

