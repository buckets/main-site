import * as electron_is from 'electron-is'
import {v4 as uuid} from 'uuid'
import { ipcMain, ipcRenderer, webContents } from 'electron'
import * as crypto from 'crypto'
import { EventSource } from './events'
import { PrefixLogger } from './logging'

const log = new PrefixLogger(electron_is.renderer() ? '(rpc.rend)' : '(rpc.main)')

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
 *  Generic, interprocess, room-based, typed pub-sub
 *  Can be used in either main or renderer process.
 */
export class Room<T> {
  private webContents = new Set<Electron.WebContents>();
  private isrenderer:boolean;
  private eventSources:{
    [k:string]: EventSource<any>,
  } = {};

  constructor(private key:string) {
    this.isrenderer = electron_is.renderer();
    if (this.isrenderer) {
      // renderer process
      ipcRenderer.send(`${this.key}.join`);
      log.debug(this.key, 'joining');
      ipcRenderer.on(`${this.key}.message`, (ev, channel, message) => {
        let es = this.eventSources[channel];
        if (es) {
          es.emit(message);
        }
      })
    } else {
      // main process
      ipcMain.on(`${this.key}.join`, (ev:Electron.IpcMessageEvent) => {
        let wc = webContents.fromId(ev.sender.id);
        if (!this.webContents.has(wc)) {
          log.debug(this.key, 'renderer joined:', wc.id)
        }
        this.webContents.add(wc);
        
        wc.on('destroyed', () => {
          log.debug(this.key, 'renderer destroyed:', wc.id)
          this.webContents.delete(wc);
        })
      })
      ipcMain.on(`${this.key}.pleasesend`, <K extends keyof T>(ev, channel:K, message:T[K]) => {
        this.broadcast(channel, message);
      })
    }
  }
  broadcast<K extends keyof T>(channel:K, message:T[K]) {
    if (this.isrenderer) {
      // renderer process
      ipcRenderer.send(`${this.key}.pleasesend`, channel, message);
    } else {
      // main process
      this.webContents.forEach(wc => {
        log.debug(this.key, 'broadcasting to', wc.id);
        wc.send(`${this.key}.message`, channel, message);
      })
      let es = this.eventSources[channel];
      if (es) {
        es.emit(message);
      }
    }
  }
  events<K extends keyof T>(channel:K):EventSource<T[K]> {
    if (!this.eventSources[channel]) {
      this.eventSources[channel] = new EventSource<T[K]>();
    }
    return this.eventSources[channel];
  }
}

export class RendererEventSource<T> extends EventSource<T> {
  constructor(private key:string) {
    super();
    ipcRenderer.on(`rpc-eventsource-${key}`, (message:T) => {
      // send to in-renderer subscribers
      super.emit(message)
    })
  }
  emit(message:T) {
    // send to host (who will hopefully send it back)
    ipcRenderer.send(`rpc-eventsource-${this.key}`, message);
  }
}

export class MainEventSource<T> extends EventSource<T> {
  constructor(private key:string) {
    super();
    ipcMain.on(`rpc-eventsource-${this.key}`, (message:T) => {

    })
  }
}

