import * as Path from 'path'
import { app, shell, BrowserWindow } from 'electron'
import { APP_ROOT } from './globals'

export function isRegistered():boolean {
  return false;
}

export function openBuyPage() {
  shell.openExternal("https://www.bucketsisbetter.com/buy");
}

let win:Electron.BrowserWindow = null;

export function promptForLicense() {
  console.log('promptForLicense');
  if (win) {
    win.focus();
    return;
  } else {
    console.log('new window');
    win = new BrowserWindow({
      width: 400,
      height: 200,
      show: false,
    });
    win.once('ready-to-show', () => {
      win.show();
    });
    win.on('close', ev => {
      win = null;
    });

    let path = Path.join(APP_ROOT, 'src/wwwroot/misc/enter_license.html');
    path = `file://${path}`
    win.loadURL(path);
  }
}

export function enterLicense(license:string) {
  console.log('license', license);
}

export function nag() {
  if (!isRegistered()) {
    console.log('nag');
  }
}

export function eventuallyNag() {
  if (!isRegistered()) {
    setTimeout(() => {
      nag();
    }, 15 * 60 * 1000)
  }
}

// function initial

// let userdatapath = app.getPath('userData');
//   return Path.join(userdatapath, 'preferences.json');