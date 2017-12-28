import * as moment from 'moment'
import { EventSource } from './events'

export interface SyncResult {
  errors: string[];
  imported_count: number;
}

export interface ASyncening {
  onOrAfter: moment.Moment;
  before: moment.Moment;
  done: EventSource<SyncResult>;
  result: SyncResult;
  start();
  cancel();
}

/**
 *  The various methods of syncing (OFX, SimpleFIN, macros...) should implement an ISyncChannel particular to its method of syncing.
 */
export interface ISyncChannel {
  syncTransactions(onOrAfter:moment.Moment, before:moment.Moment):ASyncening;
}

/**
 *  Aggregate ISyncChannel
 */
export class MultiSyncer implements ISyncChannel {
  constructor(private channels:ISyncChannel[]) {

  }
  syncTransactions(onOrAfter:moment.Moment, before:moment.Moment):ASyncening {
    return new MultiSyncerSync(onOrAfter, before, this.channels.map(channel => {
      return channel.syncTransactions(onOrAfter, before);
    }));
  }
}

/**
 *  Used by MultiSyncer
 */
class MultiSyncerSync implements ASyncening {
  public result: SyncResult;
  readonly done = new EventSource<SyncResult>()

  constructor(readonly onOrAfter:moment.Moment, readonly before:moment.Moment, readonly subs:ASyncening[]) {
  }
  async start() {    
    let promises:Array<Promise<SyncResult>> = [];
    
    // Start them
    this.subs.forEach(sub => {
      promises.push(new Promise(resolve => {
        sub.done.once(result => {
          resolve(result);
        })
      }));
      sub.start();
    })

    // Process results
    let errors:string[] = [];
    let imported_count = 0;
    for (let promise of promises) {
      try {
        let result = await promise;
        errors = errors.concat(result.errors);
        imported_count += result.imported_count;
      } catch(err) {
        errors.push(err.toString());
      }
    }
    this.result = {
      errors,
      imported_count,
    }
    this.done.emit(this.result);
  }
  cancel() {
    this.subs.forEach(sub => {
      sub.cancel();
    })
  }
}

