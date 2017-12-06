import * as log from 'electron-log'


export class EventSource<T> {
  private listeners:Array<{
    listener: (message:T)=>void,
    remove?: boolean,
  }> = [];

  emit(message:T) {
    this.listeners.slice().forEach(async obj => {
      try {
        await obj.listener(message);
      } catch(err) {
        log.error("Error in listener", message, err);
        log.error(err.stack);
      }
      if (obj.remove) {
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
