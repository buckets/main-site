// Copyright (c) Buckets
// See LICENSE for details.

import {app, session, protocol, BrowserWindow} from 'electron'
import * as log from 'electron-log'
import * as electron_is from 'electron-is'
import {autoUpdater} from 'electron-updater'
import * as URL from 'url'
import * as Path from 'path'
import { adjustTrialMenu } from './menu'
import { BudgetFile, watchForEvents } from './files'
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

// A file was double-clicked
let openfirst;
app.on('will-finish-launching', () => {
  app.on('open-file', function(event, path) {
    if (app.isReady()) {
      BudgetFile.openFile(path);
    } else {
      openfirst = path;
    }
    event.preventDefault();
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
  if (openfirst) {
    BudgetFile.openFile(openfirst);
  } else if (process.env.DEBUG) {
    BudgetFile.openFile('/tmp/test.buckets');  
  } else {
    openWizard();
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    openWizard();
  }
})
watchForEvents(app);


let default_win:Electron.BrowserWindow;
function openWizard() {
  if (default_win) {
    default_win.focus();
    return;
  }
  default_win = new BrowserWindow({
    width: 250,
    height: 550,
    show: false,
    center: true,
    frame: false,
  });
  default_win.once('ready-to-show', () => {
    default_win.show();
  })

  let path = Path.join(APP_ROOT, 'src/wwwroot/misc/wizard.html');
  path = `file://${path}`
  default_win.loadURL(path);
  default_win.on('close', ev => {
    default_win = null;
  })
}
export function closeWizard() {
  if (default_win) {
    default_win.close();
  }
}