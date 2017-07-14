import {BrowserWindow} from 'electron';

export function startFindInPage() {
  console.log('findStart');
  let win = BrowserWindow.getFocusedWindow();
  win.webContents.send('find-start');
}

export function findNext() {
  console.log('findNext');
  let win = BrowserWindow.getFocusedWindow();
  win.webContents.send('find-next');
}

export function findPrev() {
  console.log('findPrev');
  let win = BrowserWindow.getFocusedWindow();
  win.webContents.send('find-prev');
}
