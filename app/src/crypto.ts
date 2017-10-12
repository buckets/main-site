import * as Path from 'path'
import { BrowserWindow, ipcMain } from 'electron'
import * as keytar from 'keytar'
import {v4 as uuid} from 'uuid'
import * as querystring from 'querystring'
import * as crypto from 'crypto'

import { APP_ROOT } from './mainprocess/globals'


export function promptUser(prompt:string, args?:{
  parent?:Electron.BrowserWindow,
  password?:boolean,
}):Promise<string> {
  args = args || {};
  return new Promise((resolve, reject) => {
    let prompt_key = `prompt:${uuid()}`;

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
    console.log('path', path);
    win.loadURL(path);
  })
}

export async function getPassword(service:string, account:string, prompt?:string):Promise<string> {
  let pw = await keytar.getPassword(service, account)
  if (pw !== null) {
    return pw;
  } else if (prompt) {
    pw = await promptUser(prompt, {password:true})
    if (pw) {
      return pw;
    }
  }
  throw new Error('No password available')
}

export async function savePassword(service:string, account:string, password:string):Promise<void> {
  await keytar.setPassword(service, account, password)
}

export function encrypt(plaintext:string, password:string):string {
  console.log('HEEYYYYYYYYYYYY, USE BETTER CRYPTO');
  let cipher = crypto.createCipher('aes256', password)
  cipher.update(plaintext, 'utf8')
  return cipher.final('base64')
}
export function decrypt(ciphertext:string, password:string):string {
  console.log('HEEYYYYYYYYYYYY, USE BETTER CRYPTO');
  let cipher = crypto.createDecipher('aes256', password)
  cipher.update(ciphertext, 'base64')
  return cipher.final('utf8')
}



