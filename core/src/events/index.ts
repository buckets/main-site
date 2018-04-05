import { PrefixLogger } from '../logging'
const log = new PrefixLogger('(events)')

/**
 * Generic EventSource interface.
 */
export interface IEventSource<T> {
  emit(message:T);
  on(listener:(message:T)=>void):this
  once(listener:(message:T)=>void):this
  onceSuccessfully(listener:(message:T)=>boolean|Promise<boolean>):this
  removeAllListeners():this
  removeListener(listener:(message:T)=>void):this
}


/**
 *  Basic, single-process IEventSource implementation.
 */
export class EventSource<T> implements IEventSource<T> {
  private listeners:Array<{
    listener: (message:T)=>void|boolean|Promise<boolean>,
    remove?: boolean|'ifsuccessful',
  }> = [];

  emit(message:T) {
    this.listeners.slice().forEach(async obj => {
      let result;
      try {
        result = await obj.listener(message);
      } catch(err) {
        log.error("Error in listener", message, obj.listener);
        log.error(err.stack);
      }
      if (obj.remove === true
         || (obj.remove === 'ifsuccessful' && result === true)) {
        this.listeners.splice(this.listeners.indexOf(obj), 1);
      }
    })
  }
  on(listener:(message:T)=>void):this {
    this.listeners.push({
      listener,
    });
    return this
  }
  once(listener:(message:T)=>void):this {
    this.listeners.push({
      listener,
      remove: true,
    });
    return this
  }
  onceSuccessfully(listener:(message:T)=>boolean|Promise<boolean>):this {
    this.listeners.push({
      listener,
      remove: 'ifsuccessful',
    })
    return this;
  }
  removeAllListeners():this {
    this.listeners = [];
    return this
  }
  removeListener(listener:(message:T)=>void):this {
    let match = this.listeners.filter(obj => obj.listener === listener);
    if (match.length) {
      this.listeners.splice(this.listeners.indexOf(match[0]), 1)
    }
    return this;
  }
}
