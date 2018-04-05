import { IStore, IObject, ObjectEventType } from './interface'
import { BucketsRegistry } from './models/registry'

/**
 *  Single-process db store
 */
export class Store implements IStore<BucketsRegistry> {
  

  async publishObject(event:ObjectEventType, obj:IObject<keyof BucketsRegistry>) {

  }
  async createObject<T extends keyof BucketsRegistry>(cls:T, data:Partial<BucketsRegistry[T]>):Promise<BucketsRegistry[T]> {
    return null;
  }
  async getObject<T extends keyof BucketsRegistry>(cls:T, id:number):Promise<BucketsRegistry[T]> {
    return null;
  }
}
