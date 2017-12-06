import * as URL from 'url'

import { webContents, ipcRenderer } from 'electron'
import {} from 'bluebird'

import { EventSource } from './events'
import { BucketStore } from './models/bucket'
import { AccountStore } from './models/account'
import { SimpleFINStore } from './models/simplefin'
import { ReportStore } from './models/reports'
import { BankRecordingStore } from './models/bankrecording'

//--------------------------------------------------------------------------------
// objects
//--------------------------------------------------------------------------------
export let TABLE2CLASS = {};
export interface IObject {
  id:number;
  created: string;
  _type:string;
}
export interface IObjectClass<T> {
  new(): T;
  table_name: string;
  fromdb?(obj:T):T;
}
export function isObj<T extends IObject>(cls: IObjectClass<T>, obj: IObject): obj is T {
  return obj._type === cls.table_name;
}
export function registerClass(cls:IObjectClass<any>) {
  TABLE2CLASS[cls.table_name] = cls;
}

/**
  Store interface used in both main and renderer processes

  XXX I have plans to split this into an interface that contains
  most of the methods, and another class with the `accounts`, `buckets`,
  `connections`, etc... on it so that each implementation of
  the store doesn't have to add those members themselves.
*/
export interface IStore {
  bus:IBudgetBus;

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
  connections:SimpleFINStore;
  reports:ReportStore;
  bankrecording:BankRecordingStore;
}

//--------------------------------------------------------------------------------
// DataEvents
//--------------------------------------------------------------------------------
export type ObjectEventType =
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

/**
 *  A bus for budget-related events.
 */
export interface IBudgetBus {
  obj: EventSource<ObjectEvent<any>>;
}

class BaseBudgetBus implements IBudgetBus {
  obj = new EventSource<ObjectEvent<any>>();
}

/**
 *  Main process bus which automatically broadcasts events to renderer buses
 */
export class BudgetBus extends BaseBudgetBus {
  obj = new EventSource<ObjectEvent<any>>();

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
  obj = new EventSource<ObjectEvent<any>>();

  constructor(readonly budget_id:string) {
    super();
    ipcRenderer.on('bus', (ev, event_name: keyof IBudgetBus, message) => {
      (<EventSource<any>>this[event_name]).emit(message);
    })
  }
}

