import * as Path from 'path'
import { BrowserWindow, ipcMain } from 'electron'
import * as keytar from 'keytar'
import {v4 as uuid} from 'uuid'
import * as querystring from 'querystring'
import * as triplesec from 'triplesec'
import { onlyRunInMain } from './rpc'

import { APP_ROOT } from './mainprocess/globals'


export const promptForPassword = onlyRunInMain((prompt:string, args?:{
    parent?:Electron.BrowserWindow,
    error?:string,
  }):Promise<string> => {

  args = args || {};
  return new Promise((resolve, reject) => {
    let opts:Electron.BrowserWindowConstructorOptions = {
      modal: true,
      show: false,
      frame: false,
      minWidth: 350,
      width: 350,
      minHeight: 100,
      height: 140,
    };
    if (args.parent) {
      opts.parent = args.parent;
    }
    let win = new BrowserWindow(opts);
    win.once('ready-to-show', () => {
      win.show();
      win.focus();
    })

    // Look for an answer from the window.
    let prompt_key = `prompt:${uuid()}`;
    ipcMain.once(prompt_key, (event, {response, error}) => {
      win.close();
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    })
    let path = Path.join(APP_ROOT, 'src/wwwroot/misc/prompt.html')
    let qs:any = {
      prompt,
      key: prompt_key,
      hideinput: 'yes',
      error: args.error,
    }
    path = `file://${path}?${querystring.stringify(qs)}`;
    win.loadURL(path);
  })
})

let PW_CACHE = {};
let PW_CACHE_TIMEOUTS = {};
const CACHE_TIME = 15 * 60 * 1000;
export const cachePassword = onlyRunInMain(function(service:string, account:string, value:string) {
  const cache_key = `${service}:${account}`;
  // cache it
  PW_CACHE[cache_key] = value;

  // plan to clear it
  let existing_timer = PW_CACHE_TIMEOUTS[cache_key];
  if (existing_timer) {
    clearTimeout(existing_timer);
  }
  PW_CACHE_TIMEOUTS[cache_key] = setTimeout(() => {
    delete PW_CACHE[cache_key];
  }, CACHE_TIME);
});

/**
  Get a password from a cache, the OS keychain or optionally by prompting the user.
*/
export const getPassword = onlyRunInMain(async function getPassword(service:string, account:string, args?:{
  prompt?:string,
  no_cache?:boolean,
  error?:string,
}):Promise<string> {
  args = args || {};
  const cache_key = `${service}:${account}`;
  let pw = null;

  // try the cache
  if (!args.no_cache) {
    if (PW_CACHE[cache_key]) {
      pw = PW_CACHE[cache_key];
      return pw
    }
  }
  
  // try the OS keychain
  // pw = await keytar.getPassword(service, account)
  // if (pw !== null) {
  //   return pw
  // }

  // try the user
  if (args.prompt) {
    pw = await promptForPassword(args.prompt, {
      error: args.error,
    })
    if (pw) {
      return pw
    }
  }
  throw new Error('No password available')
});

/**
    Save a password in the OS keychain.
 */
export async function savePassword(service:string, account:string, password:string):Promise<void> {
  await keytar.setPassword(service, account, password)
}

export function encrypt(plaintext:string, password:string):Promise<string> {
  return new Promise((resolve, reject) => {
    let key = new Buffer(password, 'utf8')
    let ptbuffer = new Buffer(plaintext, 'utf8')
    triplesec.encrypt({key, data:ptbuffer}, (err, ciphertext) => {
      if (err) {
        reject(err);
      } else {
        resolve(ciphertext.toString('base64'))  
      }
    })
  })
  // let cipher = crypto.createCipher('aes256', password)
  // cipher.update(plaintext, 'utf8')
  // return cipher.final('base64')
}
export function decrypt(ciphertext:string, password:string):Promise<string> {
  return new Promise((resolve, reject) => {
    let key = new Buffer(password, 'utf8')
    let ctbuffer = new Buffer(ciphertext, 'base64')
    triplesec.decrypt({key, data:ctbuffer}, (err, plaintext) => {
      if (err) {
        reject(err);
      } else {
        resolve(plaintext.toString('utf8'))  
      }
    })
  })
}

