/**
 *
 */
export type ObjectEventType =
  | 'update'
  | 'delete'

/**
 *  All IStore-stored objects must implement this interface
 */
export interface IObject<T> {
  id: number;
  created: string;
  type: T;
}

/**
 *  Interface to a single Buckets budget file
 */
export interface IStore<Reg> {
  // bus:IBudgetBus;

  publishObject(event:ObjectEventType, obj:IObject<keyof Reg>);

  // Database-backed objects
  createObject<T extends keyof Reg>(cls: T, data:Partial<Reg[T]>):Promise<Reg[T]>;
  // updateObject<T extends keyof Reg>(cls: T, id:number, data:Partial<Reg[T]>):Promise<Reg[T]>;
  getObject<T extends keyof Reg>(cls: T, id:number):Promise<Reg[T]>;
  // listObjects<T extends keyof Reg>(cls: T, args?:{where?:string, params?:{}, order?:string[], limit?:number, offset?:number}):Promise<Array<Reg[T]>>;
  // deleteObject<T extends keyof Reg>(cls: T, id:number):Promise<null>;
  // query(sql:string, params:{}):Promise<any>;
  // exec(sql:string):Promise<any>;

  // model-specific stuff
  // accounts:AccountStore;
  // buckets:BucketStore;
  // simplefin:SimpleFINStore;
  // reports:ReportStore;
  // bankmacro:BankMacroStore;
  // settings:SettingsStore;
}