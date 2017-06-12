// Copyright (c) Buckets
// See LICENSE for details.

import {app, BrowserWindow, Menu, session, protocol} from 'electron'
import * as log from 'electron-log'
import {autoUpdater} from 'electron-updater'
import * as URL from 'url';
import * as Path from 'path';

import * as Foo from './foo';

Foo.foofunc();

autoUpdater.logger = log;
log.transports.file.level = 'info';
log.info('App starting...');

const APPPATH = app.getAppPath();

// Make accessing '/' access the expected place
protocol.registerStandardSchemes(['buckets'])
app.on('ready', () => {
  session.defaultSession.protocol.registerFileProtocol('buckets', (request, callback) => {
    log.debug('request for', request.url);
    const parsed = URL.parse(request.url);
    if (parsed.hostname !== 'main') {
      // Only main host supported right now
      callback()
    } else {
      let path = Path.join(APPPATH, 'out/wwwroot/', parsed.path);
      console.log('returning file', path);
      callback(path);
    }
    log.debug('url', parsed);
    
  }, error => {
    if (error) {
      throw new Error('failed to register buckets: protocol');
    }
  })
})

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
  win.loadURL('buckets://main/index.html');
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
