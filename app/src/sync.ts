import { EventEmitter } from 'events'
import { IStore } from './store'


export class Syncer extends EventEmitter {
  constructor(private store:IStore) {
    super();
  }

  // Events
  emit(event: 'sync-started'):boolean;
  emit(event, ...args):boolean {
    return super.emit(event, ...args);
  }
  on(event: 'sync-started', listener: () => void):this;
  on(event, listener):this {
    return super.on(event, listener);
  }
}
