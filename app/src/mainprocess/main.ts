// Copyright (c) Buckets
// See LICENSE for details.

import { app, session, protocol, BrowserWindow } from 'electron'
import * as electron_log from 'electron-log'
import * as electron_is from 'electron-is'
import { autoUpdater } from 'electron-updater'
import * as URL from 'url'
import * as Path from 'path'
import * as moment from 'moment-timezone'
import { startLocalizing } from '../i18n'
import { updateMenu } from './menu'
import { BudgetFile } from './files'
import { APP_ROOT } from './globals'
import { eventuallyNag } from './drm'
import { checkForUpdates } from './updater'
import { reportErrorToUser } from '../errors'
import { PrefixLogger } from '../logging'
import { PSTATE, updateState } from './persistent'
// import { doesPathExist, isPathExecutable, getNiceStat } from '../util'
import { localNow, setTimezone, getTimezone } from 'buckets-core/dist/time'
import { registerBucketslibLogger } from 'buckets-core/dist/logging'
import { coreVersion } from 'buckets-core/dist/util'

//----------------------------------------------------------
// For deprecated triplesec encryption
//----------------------------------------------------------
import * as triplesec from 'triplesec'
import { TriplesecCrypter } from 'buckets-core/dist/crypto'
TriplesecCrypter.setPackage(triplesec)
//----------------------------------------------------------

if (process.env.PORTABLE_EXECUTABLE_DIR) {
  electron_log.transports.file.file = Path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'log.log');
}

autoUpdater.logger = electron_log;
electron_log.transports.file.level = 'silly';
electron_log.transports.file.maxSize = 5 * 1024 * 1024;

const log = new PrefixLogger('(main)')
const corelog = new PrefixLogger('(core)')

registerBucketslibLogger((msg:string) => {
  corelog.info(msg);
});


setTimezone(PSTATE.timezone || moment.tz.guess())

log.info(`\n\nSTARTING v${app.getVersion()}\n`);
log.info(`      Core: ${coreVersion()}`)
log.info(` Log level: ${electron_log.transports.file.level}`);
log.info(`Local time: ${localNow().format()}`);
log.info(`  UTC time: ${moment.utc().format()}`);
log.info(`  Timezone: ${getTimezone()}`);
log.info(`  NODE_ENV: ${process.env.NODE_ENV}`);

/**
 *  Run permission checks
 */
// function checkForFilesystemPermissionProblems() {
//   const plog = new PrefixLogger('(permcheck)', log);
//   plog.info('start');
//   const userDataPath = app.getPath('userData')
//   if (!doesPathExist(userDataPath)) {
//     plog.error(`userData path (${userDataPath}) does not exist`);
//     const appDataPath = app.getPath('appData');
//     if (!isPathExecutable(appDataPath)) {
//       plog.error(`appData path (${appDataPath}) is not executable`);
//       plog.info(`stat of ${appDataPath}: ${JSON.stringify(getNiceStat(appDataPath))}`);
//       dialog.showMessageBox({
//         title: sss('Error'),
//         message: sss('file-perm-error', 'Permission error' /* Error title for file permission problem */),
//         detail: sss('file-perm-error-detail', (path:string) => `Buckets is unable to create a directory inside "${path}".  Buckets uses the directory to save preferences.\n\nPlease adjust permissions and restart Buckets.`)(appDataPath),
//         buttons: [
//           sss('OK'),
//         ],
//         defaultId: 0,
//       }, () => {

//       })
//     }
//   }
//   plog.info('done');
// }

process.on('uncaughtException', (err) => {
  log.error('uncaughtException', err && err.stack ? err.stack : err);
  reportErrorToUser(null, {
    err: err,
  })
})

protocol.registerStandardSchemes(['buckets'])

app.on('ready', async () => {
  // checkForFilesystemPermissionProblems();
  await startLocalizing();
  
  // Make accessing '/' access the expected place
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

  // Create the Menu
  updateMenu();

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

  // Nag screen
  eventuallyNag();

  if (!electron_is.dev()) {
    log.info('Checking for updates...');
    checkForUpdates()
  } else {
    log.info('Not checking for updates in DEV mode.');
  }
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
    updateMenu({budget: BudgetFile.fromWindowId(win.id)});
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