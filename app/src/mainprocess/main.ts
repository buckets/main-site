// Copyright (c) Buckets
// See LICENSE for details.

import {app, session, protocol, BrowserWindow} from 'electron'
import * as log from 'electron-log'
import * as electron_is from 'electron-is'
import {autoUpdater} from 'electron-updater'
import * as URL from 'url'
import * as Path from 'path'
import { updateMenu, updateEnabled } from './menu'
import { BudgetFile, watchForEvents } from './files'
import {APP_ROOT} from './globals'
import { eventuallyNag } from './drm'
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
app.on('browser-window-created', (ev, win) => {
  if (win !== wiz_win) {
    closeWizard();
  }
})
app.on('browser-window-focus', (ev, win) => {
  if (win.webContents.getURL().startsWith('buckets://')) {
    // budget window
    updateEnabled(true);
  } else {
    // non-budget window
    updateEnabled(false);
  }
})
watchForEvents(app);


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
export function closeWizard() {
  if (wiz_win) {
    wiz_win.close();
  }
}