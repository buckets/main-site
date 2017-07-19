// Copyright (c) Buckets
// See LICENSE for details.

import {app, session, protocol} from 'electron'
import * as log from 'electron-log'
import * as electron_is from 'electron-is'
import {autoUpdater} from 'electron-updater'
import * as URL from 'url'
import * as Path from 'path'
import { adjustTrialMenu } from './menu'
import {BudgetFile} from './files'
import {APP_ROOT} from './globals'
import { isRegistered, eventuallyNag } from './drm'
import { checkForUpdates } from './updater'

autoUpdater.logger = log;
log.transports.file.level = 'info';
log.info('App starting...');


// Make accessing '/' access the expected place
protocol.registerStandardSchemes(['buckets'])
app.on('ready', () => {
  session.defaultSession.protocol.registerFileProtocol('buckets', (request, callback) => {
    const parsed = URL.parse(request.url);
    let bf = BudgetFile.REGISTRY[parsed.hostname];
    if (bf || parsed.hostname === 'main') {
      let path = Path.join(APP_ROOT, 'src/wwwroot/', parsed.pathname);
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
  adjustTrialMenu();

  // Nag screen
  if (!isRegistered()) {
    eventuallyNag();
  }

  if (!electron_is.dev()) {
    checkForUpdates()
  }

  // Temporary window just to nab focus
  // new BrowserWindow({width: 400, height: 300});

  // For now, open a standard file for testing
  BudgetFile.openFile('/tmp/test.buckets');
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
