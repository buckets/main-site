import * as URL from 'url'

import { webContents, ipcRenderer } from 'electron'
import {} from 'bluebird'

import { EventSource } from 'buckets-core'

//----------------------------------------------------------------------
// Database objects
//----------------------------------------------------------------------
export let TABLE2CLASS = {};
export interface IObject {
  id:number;
  created: string;
  _type:string;
}
export interface IObjectClass<T> {
  new(): T;
  type: string;
  fromdb?(obj:T):T;
}
export function isObj<T extends IObject>(cls: IObjectClass<T>, obj: IObject): obj is T {
  return obj._type === cls.type;
}
export function registerClass(cls:IObjectClass<any>) {
  TABLE2CLASS[cls.type] = cls;
}


/**
  Store interface used in both main and renderer processes

  This is augmented in other modules, so not everything you see here
  is everything that's part of IStore.
*/
export interface IStore {
  bus:IBudgetBus;

  publishObject(event:ObjectEventType, obj:IObject);

  // Database-backed objects
  createObject<T extends IObject>(cls: IObjectClass<T>, data:Partial<T>):Promise<T>;
  updateObject<T extends IObject>(cls: IObjectClass<T>, id:number, data:Partial<T>):Promise<T>;
  getObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<T>;
  listObjects<T extends IObject>(cls: IObjectClass<T>, args?:{where?:string, params?:{}, order?:string[], limit?:number, offset?:number}):Promise<T[]>;
  deleteObject<T extends IObject>(cls: IObjectClass<T>, id:number):Promise<any>;
  query(sql:string, params:{}):Promise<any>;
  exec(sql:string):Promise<null>;
}

//----------------------------------------------------------------
// DataEvents
//----------------------------------------------------------------
export type ObjectEventType =
  'update'
  | 'delete';

/**
 *  Update/delete event for database-stored objects.
 */
export class ObjectEvent<T extends IObject> {
  constructor(readonly event:ObjectEventType, readonly obj:T) {
  }
}

/**
 *  A bus for budget-related events.
 */
export interface IBudgetBus {
  // Database object events
  obj: EventSource<ObjectEvent<any>>;
}
class BaseBudgetBus implements IBudgetBus {
  obj = new EventSource<ObjectEvent<any>>();
}

/**
 *  Main process bus which automatically broadcasts events to renderer buses
 */
export class BudgetBus extends BaseBudgetBus {
  constructor(readonly budget_id:string) {
    super();
    // monitor all local events for broadcast
    Object.keys(this).forEach(event => {
      let prop = this[event];
      if (prop instanceof EventSource) {
        prop.on(message => {
          this.broadcast(event as any, message);
        })
      }
    })
  }
  private broadcast(event: keyof IBudgetBus, message) {
    webContents.getAllWebContents().forEach(wc => {
      if (URL.parse(wc.getURL()).hostname === this.budget_id) {
        wc.send('bus', event, message)
      }
    })
  }
}

/**
 *  Renderer process bus that automatically receives all events from the main process bus
 */ 
export class BudgetBusRenderer extends BaseBudgetBus {
  constructor(readonly budget_id:string) {
    super();
    ipcRenderer.on('bus', (ev, event_name: keyof IBudgetBus, message) => {
      (<EventSource<any>>this[event_name]).emit(message);
    })
  }
}

