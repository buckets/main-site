import * as electron_is from 'electron-is'
import {v4 as uuid} from 'uuid'
import { ipcMain, ipcRenderer, webContents } from 'electron'
import * as crypto from 'crypto'
import { PrefixLogger } from './logging'
import { EventCollection, IEventCollection } from 'buckets-core/dist/store'

const log = new PrefixLogger(electron_is.renderer() ? '(rpc.r)' : '(rpc)')

//--------------------------------------------------------------------------------
// General purpose RPC from renderer to main and back
//--------------------------------------------------------------------------------

/**
 *  Wrap a function so that it will only ever be called in the main process.
 *  
 *  If you call the function from a renderer process, it will make a request
 *  of the main process to run the function.
 *
 *  You can only wrap functions which have serializable objects arguments and
 *  return values.
 */
export function onlyRunInMain<F extends Function>(func:F):F {
  const hash = crypto.createHash('sha256');
  hash.update(func.name);
  hash.update(func.toString());
  const key = `rpc-mainfunc-${hash.digest('hex')}`;
  if (electron_is.renderer()) {
    // renderer process
    return <any>function(...args) {
      let chan = `rpc-response-${uuid()}`
      return new Promise((resolve, reject) => {
        ipcRenderer.once(chan, (ev, {result, err}) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);  
          }
        })
        ipcRenderer.send(key, chan, ...args);  
      })  
    }
  } else {
    // main process
    ipcMain.on(key, async (ev, chan, ...args) => {
      try {
        let result = await func(...args);
        ev.sender.send(chan, {result})
      } catch(err) {
        ev.sender.send(chan, {err})
      }
    })
    return <any>function(...args) {
      return func(...args);
    }
  }
}


/**
 *  Electron main process EventCollection which connects by key to
 *  renderers.  Connected renderers receive all events this receives
 *  and can submit events to this.
 */
export class MainEventCollection<T> extends EventCollection<T> {
  private webContents = new Map<number, Electron.WebContents>();

  constructor(private wrapped:IEventCollection<T>, private key:string) {
    super();

    // Watch for renderers to join
    ipcMain.on(`${this.key}.join`, (ev:Electron.IpcMessageEvent) => {
      const wc_id = ev.sender.id;
      if (this.webContents.has(wc_id)) {
        // already joined
        return;
      }

      const wc = webContents.fromId(wc_id);
      log.info(this.key, 'renderer joined:', wc_id)
      this.webContents.set(wc_id, wc);
      wc.on('destroyed', () => {
        this.webContents.delete(wc_id);
      })
    });

    // Watch for renderers to broadcast
    ipcMain.on(`${this.key}.pleasesend`, <K extends keyof T>(ev, channel:K, message:T[K]) => {
      // Send up to parent
      this.broadcast(channel, message);
    })

    // Watch the wrapped one for events
    wrapped.all.on(({channel, message}) => {
      this._broadcastToChildren(channel, message);
    });
  }
  broadcast<K extends keyof T>(channel:K, message:T[K]) {
    // Send to parent (who will then send back to this)
    this.wrapped.broadcast(channel, message);
  }
  private _broadcastToChildren<K extends keyof T>(channel:K, message:T[K]) {
    // Renderer children
    this.webContents.forEach(wc => {
      wc.send(`${this.key}.message`, channel, message);
    })
    // Normal broadcast
    super.broadcast(channel, message);
  }
}

/**
 *  Renderer process EventCollection which listens for events from and broadcasts events to
 *  a MainEventCollection with the same key.
 */
export class RendererEventCollection<T> extends EventCollection<T> {
  constructor(private key:string) {
    super();
    log.info(this.key, 'joining');
    ipcRenderer.send(`${this.key}.join`);
    ipcRenderer.on(`${this.key}.message`, (ev, channel, message) => {
      super.broadcast(channel, message);
    })
  }
  broadcast<K extends keyof T>(channel:K, message:T[K]) {
    ipcRenderer.send(`${this.key}.pleasesend`, channel, message);
  }
}

/**
 *  Generic, interprocess, room-based, typed pub-sub
 *  Can be used in either main or renderer process.
 */
// export class Room<T> {
//   private webContents = new Map<number, Electron.WebContents>();
//   private isrenderer:boolean;
//   private eventSources:{
//     [k:string]: EventSource<any>,
//   } = {};

//   constructor(private key:string) {
//     this.isrenderer = electron_is.renderer();
//     if (this.isrenderer) {
//       // renderer process
//       log.info(this.key, 'joining');
//       ipcRenderer.send(`${this.key}.join`);
//       ipcRenderer.on(`${this.key}.message`, (ev, channel, message) => {
//         let es = this.eventSources[channel];
//         if (es) {
//           es.emit(message);
//         }
//       })
//     } else {
//       // main process
//       ipcMain.on(`${this.key}.join`, (ev:Electron.IpcMessageEvent) => {
//         let wc_id = ev.sender.id;
//         if (this.webContents.has(wc_id)) {
//           return;
//         }

//         let wc = webContents.fromId(wc_id);
//         log.info(this.key, 'renderer joined:', wc_id)
//         this.webContents.set(wc_id, wc);
//         wc.on('destroyed', () => {
//           this.webContents.delete(wc_id);
//         })
//       })
//       ipcMain.on(`${this.key}.pleasesend`, <K extends keyof T>(ev, channel:K, message:T[K]) => {
//         this.broadcast(channel, message);
//       })
//     }
//   }
//   broadcast<K extends keyof T>(channel:K, message:T[K]) {
//     if (this.isrenderer) {
//       // renderer process
//       ipcRenderer.send(`${this.key}.pleasesend`, channel, message);
//     } else {
//       // main process
//       this.webContents.forEach(wc => {
//         wc.send(`${this.key}.message`, channel, message);
//       })
//       let es = this.eventSources[channel];
//       if (es) {
//         es.emit(message);
//       }
//     }
//   }
//   events<K extends keyof T>(channel:K):EventSource<T[K]> {
//     if (!this.eventSources[channel]) {
//       this.eventSources[channel] = new EventSource<T[K]>();
//     }
//     return this.eventSources[channel];
//   }
// }

