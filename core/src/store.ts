/**
  This module contains stuff that is NOT specific to Buckets.
  Keep buckets-specific stuff out.
 */
import { EventSource } from '@iffycan/events'

export interface IObject {
  id: number;
  created: string;
  _type: string;
}
/**
 *  For type guards: returns true if the passed in object is of the given type.
 *
 *  Usage:
 *    isObj('bucket', somebucketobj)
 */
export function isObj<T extends keyof IObjectTypes>(cls:T, obj: IObject): obj is IObjectTypes[T] {
  return obj._type === cls;
}


/**
 *  The global list of database tables/object types
 *  You can add to this FROM other modules by doing something
 *  like:
 *
 *  interface IFooBar extends IObject {
 *    myattr: string;
 *  }
 *  declare module './store' {
 *    interface IObjectTypes {
 *      foobar: IFooBar;
 *    }
 *  }
 */
export interface IObjectTypes {}

export type ObjectEventType =
  | 'update'
  | 'delete'
export interface IObjectEvent {
  event: ObjectEventType;
  obj: IObject;
}
/**
 *  Utility function for making IObjectEvents
 */
export function makeEvent<T extends keyof IObjectTypes>(event:ObjectEventType, obj:IObjectTypes[T]):IObjectEvent {
  return {
    event,
    obj,
  }
}

export interface IStore {

  // Events
  events:EventCollection<IStoreEvents>;

  // Application-specific stuff
  sub:ISubStore;

  publishObject(event:ObjectEventType, obj:IObject):void;

  createObject<T extends keyof IObjectTypes>(cls:T, data:Partial<IObjectTypes[T]>):Promise<IObjectTypes[T]>;
  
  getObject<T extends keyof IObjectTypes>(cls:T, id:number):Promise<IObjectTypes[T]>;

  updateObject<T extends keyof IObjectTypes>(cls:T, id:number, data:Partial<IObjectTypes[T]>):Promise<IObjectTypes[T]>;

  listObjects<T extends keyof IObjectTypes>(cls:T,
    args?: {
      where?:string,
      params?:{},
      order?:string[],
      limit?:number,
      offset?:number
    }):Promise<IObjectTypes[T][]>;

  deleteObject<T extends keyof IObjectTypes>(cls:T, id:number):Promise<any>;

  query<T>(sql:string, params:{}):Promise<Array<T>>;

  exec(sql:string):Promise<null>;
}

export interface EventCollection<T> {
  broadcast<K extends keyof T>(channel:K, message:T[K]);
  get<K extends keyof T>(channel:K):EventSource<T[K]>;
}

/**
 *  Application-specific events for the store.
 *  To be expanded like IObjectTypes is.
 */
export interface IStoreEvents {
  obj: IObjectEvent;
}

/**
 *  Application-specific store operations.
 *  To be expanded like IObjectTypes is.
 */
export interface ISubStore {}
