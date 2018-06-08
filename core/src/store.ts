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

export interface IStore {

  // Events
  events:IEventCollection<IStoreEvents>;

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



export interface IEventCollectionBroadcast<T, K extends keyof T> {
  channel: K;
  message: T[K];
}
export interface IEventCollection<T> {
  /**
   *  An EventSource that emits all events
   */
  all:EventSource<IEventCollectionBroadcast<T, keyof T>>;
  
  /**
   *  Broadcast a message of a particular type to all listeners
   */
  broadcast<K extends keyof T>(channel:K, message:T[K]);

  /**
   *  Get a single channel's EventSource
   */
  get<K extends keyof T>(channel:K):EventSource<T[K]>;
}
/**
 *  Basic in-process eventcollection thing
 */
export class EventCollection<T> implements IEventCollection<T> {
  private eventSources:{
    [k:string]: EventSource<any>;
  } = {};

  readonly all = new EventSource<IEventCollectionBroadcast<T, keyof T>>();

  broadcast<K extends keyof T>(channel:K, message:T[K]) {
    const es = this.eventSources[channel as string];
    if (es) {
      es.emit(message);
    }
    this.all.emit({
      channel: channel,
      message: message,
    })
  }
  get<K extends keyof T>(channel:K):EventSource<T[K]> {
    let key = channel as string;
    if (!this.eventSources[key]) {
      this.eventSources[key] = new EventSource<T[K]>();
    }
    return this.eventSources[key];
  }
}
