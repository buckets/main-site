import {EventEmitter} from 'events'
import {} from 'bluebird'
import {BucketStore} from './models/bucket'
import {AccountStore} from './models/account'

//--------------------------------------------------------------------------------
// objects
//--------------------------------------------------------------------------------
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
export class DataEventEmitter extends EventEmitter {
  emit(event: 'obj', obj:ObjectEvent<any>):boolean;
  emit(event, obj):boolean {
    return super.emit(event, obj);
  }
  on(event: 'obj', listener: (obj:ObjectEvent<any>) => void):this;
  on(event, listener):this {
    return super.on(event, listener);
  }
}