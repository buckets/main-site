import * as electron_is from 'electron-is'
import {v4 as uuid} from 'uuid'
import { ipcMain, ipcRenderer } from 'electron'

//--------------------------------------------------------------------------------
// General purpose RPC from renderer to main and back
//--------------------------------------------------------------------------------

export function onlyRunInMain<F extends Function>(name:string, func:F):F {
  const key = `buckets:rpc:${name}`;
  if (electron_is.renderer()) {
    // renderer process
    return <any>function(...args) {
      let chan = `buckets:rpc:response:${uuid()}`
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

