import * as electron_is from 'electron-is'
import {v4 as uuid} from 'uuid'
import { ipcMain, ipcRenderer } from 'electron'
import * as crypto from 'crypto'

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
