// Copyright (c) Buckets
// See LICENSE for details.

import {app, BrowserWindow, Menu} from 'electron'
import * as log from 'electron-log'
import {autoUpdater} from 'electron-updater'

autoUpdater.logger = log;
log.transports.file.level = 'info';
log.info('App starting...');

const APPPATH = app.getAppPath();

let template = []
if (process.platform === 'darwin') {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  })
}

let win;

function createDefaultWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
  });
  win.on('closed', () => {
    win = null;
  });
  win.openDevTools();
  win.loadURL(`file://${APPPATH}/out/pages/pages/index/index.html`);
  return win;
}
app.on('ready', function() {
  // Create the Menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createDefaultWindow();
});
app.on('window-all-closed', () => {
  app.quit();
});
