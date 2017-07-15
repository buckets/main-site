import {BrowserWindow} from 'electron';

export function startFindInPage() {
  let win = BrowserWindow.getFocusedWindow();
  win.webContents.send('find-start');
}

export function findNext() {
  let win = BrowserWindow.getFocusedWindow();
  win.webContents.send('find-next');
}

export function findPrev() {
  let win = BrowserWindow.getFocusedWindow();
  win.webContents.send('find-prev');
}
