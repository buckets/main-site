import * as Path from 'path'
import { BrowserWindow, ipcMain, ipcRenderer } from 'electron'
import * as keytar from 'keytar'
import {v4 as uuid} from 'uuid'
import * as querystring from 'querystring'
import * as triplesec from 'triplesec'
import * as electron_is from 'electron-is'

import { APP_ROOT } from './mainprocess/globals'


export function promptUser(prompt:string, args?:{
  parent?:Electron.BrowserWindow,
  password?:boolean,
}):Promise<string> {
  if (electron_is.renderer()) {
    let chan = `response:${uuid()}`
    return new Promise((resolve, reject) => {
      ipcRenderer.once(chan, (ev, response) => {
        resolve(response);
      })
      ipcRenderer.send('buckets:crypto:promptUser', chan, prompt, args);  
    })
  }
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

if (electron_is.main()) {
  ipcMain.on('buckets:crypto:promptUser', async (ev, chan, prompt, args?) => {
    try {
      let val = await promptUser(prompt, args);
      ev.sender.send(chan, val);
    } catch(err) {
      ev.sender.send(chan, null);
    }
    
  })
}

