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

  // UI-specific stuff
  ui:IUserInterfaceFunctions;

  /**
   *  Emit a change/delete notification about an object.
   */
  publishObject(event:ObjectEventType, obj:IObject):void;

  /**
   *  Create an instance of a database object.
   */
  createObject<T extends keyof IObjectTypes>(cls:T, data:Partial<IObjectTypes[T]>):Promise<IObjectTypes[T]>;
  
  /**
   *  Get a single instance of a database object.
   */
  getObject<T extends keyof IObjectTypes>(cls:T, id:number):Promise<IObjectTypes[T]>;

  /**
   *  Update a database object.
   */
  updateObject<T extends keyof IObjectTypes>(cls:T, id:number, data:Partial<IObjectTypes[T]>):Promise<IObjectTypes[T]>;

  /**
   *  List objects of a certain type.
   */
  listObjects<T extends keyof IObjectTypes>(cls:T,
    args?: {
      where?:string,
      params?:{},
      order?:string[],
      limit?:number,
      offset?:number
    }):Promise<IObjectTypes[T][]>;

  /**
   *  Delete a database object and emit a deletion event.
   */
  deleteObject<T extends keyof IObjectTypes>(cls:T, id:number):Promise<any>;

  /**
   *  Run a single, result-returning SQL statement.
   */
  query<T>(sql:string, params:{}):Promise<Array<T>>;

  /**
   *  Execute an array of SQL statements within single transaction
   *  No result is returned.
   */
  executeMany(sqls:string[]):Promise<null>;

  /**
   *  Run a function, recording its effects so that it can be undone
   */
  doAction<T>(label:string, func:(...args)=>T|Promise<T>):Promise<T>;

  /**
   *  Make a checkpoint as the start of an action to be undone.
   *  Everything performed until finishAction will be part of the
   *  action.
   *
   *  Normally, just use doAction, which does startAction
   *  and finishAction for you.
   */
  startAction(label:string):Promise<number>;

  /**
   *  Finish an action started by startAction.
   */
  finishAction(id:number):Promise<void>;

  /**
   *  Undo the last action recorded by doAction.
   */
  doUndo():Promise<void>;
  
  /**
   *  Redo the last action undone by doUndo.
   */
  doRedo():Promise<void>;
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
export interface ISubStore {
  fromDB: IFromDBFunctions
}

/**
 *  Application-specific db->object functions.
 *  These functions operate on each object as it comes
 *  out of the database
 */
export interface IFromDBFunctions {}


/**
 *  User Interface specific functions/handlers.
 *  For instance, the desktop app will have one implementation
 *  and mobile apps will have another.
 *  To be expanded like IObjectTypes is.
 */
export interface IUserInterfaceFunctions {
  /**
   *  Attach these functions to a particular IStore instance
   */
  attachStore(store:IStore);

  /**
   *  Thing for making HTTP requests
   */
  http:IHTTPRequester;

}

/**
 *  Options for HTTP requests
 */
export interface IHTTPRequestOptions {
  uri: string;
  method: string;
  qs?: {
    [k:string]: string|number;
  };
}
/**
 *  Interface for an HTTP Request maker
 */
export interface IHTTPRequester {
  fetchBody(args:IHTTPRequestOptions):Promise<string>;
}



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
