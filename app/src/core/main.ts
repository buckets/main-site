// Copyright (c) Buckets
// See LICENSE for details.

import {app, BrowserWindow, Menu, session, protocol} from 'electron'
import * as log from 'electron-log'
import {autoUpdater} from 'electron-updater'
import * as URL from 'url';
import * as Path from 'path';
import {menu} from './menu';
import {BudgetFile} from './files';

autoUpdater.logger = log;
log.transports.file.level = 'info';
log.info('App starting...');

export const APPPATH = app.getAppPath();

// Make accessing '/' access the expected place
protocol.registerStandardSchemes(['buckets'])
app.on('ready', () => {
  session.defaultSession.protocol.registerFileProtocol('buckets', (request, callback) => {
    const parsed = URL.parse(request.url);
    let bf = BudgetFile.REGISTRY[parsed.hostname];
    if (bf || parsed.hostname === 'main') {
      let path = Path.join(APPPATH, 'src/wwwroot/', parsed.path);
      console.log('returning file', path);
      callback(path);
    } else {
      // No a known host
      callback()
    }
  }, error => {
    if (error) {
      throw new Error('failed to register buckets: protocol');
    }
  })
})


app.on('ready', function() {
  // Create the Menu
  Menu.setApplicationMenu(menu);

  // Temporary window just to nab focus
  new BrowserWindow({width: 400, height: 300});
});
app.on('window-all-closed', () => {
  app.quit();
});
