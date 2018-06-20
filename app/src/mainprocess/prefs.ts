import { BrowserWindow } from 'electron'
import * as Path from 'path'
import { APP_ROOT } from './globals'

let win:Electron.BrowserWindow;

export function openPreferences() {
  if (win) {
    win.focus();
    return;
  }
  win = new BrowserWindow({
    width: 500,
    height: 300,
    minWidth: 400,
    minHeight: 200,
    show: false,
  })
  win.once('ready-to-show', () => {
    win.show();
  })
  win.on('close', () => {
    win = null;
  })
  let path = Path.join(APP_ROOT, 'src/wwwroot/misc/preferences.html');
  path = `file://${path}`
  win.loadURL(path);
}
