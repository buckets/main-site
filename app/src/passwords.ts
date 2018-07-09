import * as Path from 'path'
import { BrowserWindow, ipcMain } from 'electron'
// import * as keytar from 'keytar'
import {v4 as uuid} from 'uuid'
import * as querystring from 'querystring'
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


/**
  Get a password from the OS keychain or optionally by prompting the user.
*/
export const getPassword = onlyRunInMain(async function getPassword(pwkey:string, args:{
  prompt?:string,
  error?:string,
}={}):Promise<string> {
  let pw:string;
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
// export async function savePassword(service:string, account:string, password:string):Promise<void> {
//   await keytar.setPassword(service, account, password)
// }

