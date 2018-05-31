import { EventSource } from './events'

export interface IObject {
  id: number;
  created: string;
  _type: string;
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
  events:EventSource<IObjectEvent>;

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
 *  Application-specific store operations.
 *  To be expanded as like IObjectTypes is.
 */
export interface ISubStore {}