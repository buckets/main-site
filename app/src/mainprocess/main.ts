// Copyright (c) Buckets
// See LICENSE for details.

import {app, session, protocol, BrowserWindow} from 'electron'
import * as electron_log from 'electron-log'
import * as electron_is from 'electron-is'
import {autoUpdater} from 'electron-updater'
import * as URL from 'url'
import * as Path from 'path'
import * as moment from 'moment'
import { startLocalizing } from '../i18n'
import { updateMenu } from './menu'
import { BudgetFile } from './files'
import { APP_ROOT } from './globals'
import { eventuallyNag } from './drm'
import { checkForUpdates } from './updater'
import { reportErrorToUser } from '../errors'
import { PrefixLogger } from '../logging'
import { PSTATE, updateState } from './persistent'

autoUpdater.logger = electron_log;
electron_log.transports.file.level = 'silly';
electron_log.transports.file.maxSize = 10 * 1024 * 1024;

const log = new PrefixLogger('(main)')

log.info(`\n\nSTARTING v${app.getVersion()}\n`);
log.info(`Log level: ${electron_log.transports.file.level}`);
log.info(`Local time: ${moment().format()}`);
log.info(`  UTC time: ${moment.utc().format()}`);
log.info(`NODE_ENV: ${process.env.NODE_ENV}`);

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
      if (path.endsWith('/')) {
        path = `${path}/index.html`;
      }
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

app.on('ready', async () => {
  
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

  if (openfirst.length) {
    while (openfirst.length) {
      await BudgetFile.openFile(openfirst.shift());  
    }
  } else if (process.env.BUCKETS_DEVMODE) {
    // Open a file for easy testing
    await BudgetFile.openFile('/tmp/test.buckets', {create: true});
  } else if (PSTATE.last_opened_windows.length) {
    // Try to open the last set of windows
    log.info('Attempting to open last known set of windows:', PSTATE.last_opened_windows);
    try {
      await Promise.all(PSTATE.last_opened_windows.map(window_set => {
        log.info('Opening', window_set.filename);
        return BudgetFile.openFile(window_set.filename, {
          windows: window_set.windows,
        })
      }))
    } catch(err) {
      log.error('Error opening last set of windows');
      log.error(err);
    }
  }

  if (BrowserWindow.getAllWindows().length === 0) {
    openWizard();
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  } else {
    updateMenu();
  }
});
app.on('before-quit', () => {
  const window_map = BudgetFile.currentWindowSet();
  const last_opened_windows = Object.keys(window_map).map(filename => {
    return {
      filename,
      windows: window_map[filename],
    }
  });
  log.info('saving last_opened_windows', JSON.stringify(last_opened_windows));
  updateState({
    last_opened_windows,
  })
})
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
      win.webContents.once('did-navigate', (ev, url) => {
        resolve(url);
      })
      win.webContents.once('destroyed', (ev) => {
        reject('webcontents destroyed');
      })
    }
  });
}
app.on('browser-window-created', async (ev, win) => {
  try {
    let url = await eventuallyGetURL(win);
    log.info('window opened to', url);
    if (win !== wiz_win) {
      if (url.startsWith('buckets://')) {
        // budget window
        closeWizard();
      } else {
        // non-budget utility window
      }
    }
  } catch(err) {
    log.error("Error getting URL to close wizard");
  }
})
app.on('browser-window-focus', (ev, win) => {
  const url = URL.parse(win.webContents.getURL());
  if (url.protocol === 'buckets:' && url.path.startsWith('/budget/index.html')) {
    // budget window
    updateMenu({budget:true});
  } else {
    // non-budget window
    updateMenu();
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