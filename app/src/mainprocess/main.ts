// Copyright (c) Buckets
// See LICENSE for details.

import {app, session, protocol, BrowserWindow} from 'electron'
import * as log from 'electron-log'
import * as electron_is from 'electron-is'
import {autoUpdater} from 'electron-updater'
import * as URL from 'url'
import * as Path from 'path'
import { startLocalizing } from '../i18n'
import { updateMenu } from './menu'
import { BudgetFile } from './files'
import { APP_ROOT } from './globals'
import { eventuallyNag } from './drm'
import { checkForUpdates } from './updater'
import { reportErrorToUser } from '../errors'

autoUpdater.logger = log;
log.transports.file.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024;
log.info('App starting...');

app.on('ready', () => {
  startLocalizing();
});

process.on('uncaughtException' as any, (err) => {
  log.error('uncaughtException', err.stack);
  reportErrorToUser(null, {
    err: err,
  })
})

// Make accessing '/' access the expected place
protocol.registerStandardSchemes(['buckets'])
app.on('ready', () => {
  session.defaultSession.protocol.registerFileProtocol('buckets', (request, callback) => {
    const parsed = URL.parse(request.url);
    let bf = BudgetFile.fromId(parsed.hostname);
    if (bf || parsed.hostname === 'main') {
      let path = Path.join(APP_ROOT, 'src/wwwroot/', parsed.pathname);
      callback(path);
    } else if (parsed.hostname === 'docs') {
      // docs
      let path = Path.join(APP_ROOT, 'docs/', parsed.pathname);
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
let openfirst:string[] = [];
app.on('will-finish-launching', () => {
  app.on('open-file', function(event, path) {
    if (app.isReady()) {
      BudgetFile.openFile(path);
    } else {
      openfirst.push(path);
    }
    event.preventDefault();
  })
})
if (electron_is.windows()) {
  process.argv.forEach(arg => {
    if (arg.endsWith('.buckets')) {
      openfirst.push(arg);
    }
  })
}

app.on('ready', function() {
  // Create the Menu
  updateMenu();

  // Nag screen
  eventuallyNag();

  if (!electron_is.dev()) {
    log.info('Checking for updates...');
    checkForUpdates()
  } else {
    log.info('Not checking for updates in DEV mode.');
  }

  // For now, open a standard file for testing
  if (openfirst.length) {
    while (openfirst.length) {
      BudgetFile.openFile(openfirst.shift());  
    }
  } else if (process.env.DEBUG) {
    BudgetFile.openFile('/tmp/test.buckets', true);  
  } else {
    openWizard();
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  } else {
    updateMenu(false);
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    openWizard();
  }
})
function eventuallyGetURL(win:Electron.BrowserWindow):Promise<string> {
  return new Promise((resolve, reject) => {
    let url = win.webContents.getURL();
    if (url) {
      resolve(url);
    } else {
      win.webContents.once('did-navigate', () => {
        url = win.webContents.getURL();
        resolve(url);
      })
    }
  });
}
app.on('browser-window-created', (ev, win) => {
  if (win !== wiz_win) {
    eventuallyGetURL(win)
    .then(url => {
      if (url.startsWith('buckets://')) {
        // budget window
        closeWizard();
      } else {
        // non-budget utility window
      }
    })
  }
})
app.on('browser-window-focus', (ev, win) => {
  if (win.webContents.getURL().startsWith('buckets://')) {
    // budget window
    updateMenu(true);
  } else {
    // non-budget window
    updateMenu(false);
  }
})

let wiz_win:Electron.BrowserWindow;
function openWizard() {
  if (wiz_win) {
    wiz_win.focus();
    return;
  }
  wiz_win = new BrowserWindow({
    width: 250,
    height: 600,
    show: false,
    center: true,
    frame: false,
  });
  wiz_win.once('ready-to-show', () => {
    wiz_win.show();
  })

  let path = Path.join(APP_ROOT, 'src/wwwroot/misc/wizard.html');
  path = `file://${path}`
  wiz_win.loadURL(path);
  wiz_win.on('close', ev => {
    wiz_win = null;
  })
}
function closeWizard() {
  if (wiz_win) {
    wiz_win.close();
  }
}