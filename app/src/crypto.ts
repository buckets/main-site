import * as Path from 'path'
import { BrowserWindow, ipcMain } from 'electron'
import * as keytar from 'keytar'
import {v4 as uuid} from 'uuid'
import * as querystring from 'querystring'
import * as triplesec from 'triplesec'
import { onlyRunInMain } from './rpc'

import { APP_ROOT } from './mainprocess/globals'


export const promptUser = onlyRunInMain('crypto.promptUser',
  (prompt:string, args?:{
    parent?:Electron.BrowserWindow,
    password?:boolean,
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
      height: 120,
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
    }
    if (args.password) {
      qs.hideinput = 'yes';
    }
    path = `file://${path}?${querystring.stringify(qs)}`;
    win.loadURL(path);
  })
})

let PW_CACHE = {};
const CACHE_TIME = 15 * 60 * 1000;
function cachePassword(key:string, value:string) {
  PW_CACHE[key] = value;
  setTimeout(() => {
    delete PW_CACHE[key];
  }, CACHE_TIME)
}

/** Get a password from a cache, the OS keychain or optionally by prompting the user.
*/
export const getPassword = onlyRunInMain('crypto.getPassword', async function getPassword(service:string, account:string, args?:{
  prompt?:string,
  no_cache?:boolean,
}):Promise<string> {
  args = args || {};
  const cache_key = `${service}:${account}`;
  console.log("cache_key", cache_key);
  if (!args.no_cache) {
    console.log("looking in cache");
    if (PW_CACHE[cache_key]) {
      console.log("found in cache");
      return PW_CACHE[cache_key];
    }
  }
  let pw = await keytar.getPassword(service, account)
  if (pw !== null) {
    args.no_cache || cachePassword(cache_key, pw);
    return pw;
  } else if (args.prompt) {
    pw = await promptUser(args.prompt, {password:true})
    if (pw) {
      args.no_cache || cachePassword(cache_key, pw);
      return pw;
    }
  }
  throw new Error('No password available')
});

/** Save a password in the OS keychain.
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

