import * as electron_is from 'electron-is'
import * as https from 'https'
import * as Path from 'path'
import { shell, app, dialog, BrowserWindow, ipcMain } from 'electron'
import { APP_ROOT } from './globals'
import { autoUpdater } from 'electron-updater'
import { sss } from '../i18n';
import { PSTATE, updateState } from './persistent'
import { PrefixLogger } from '../logging'

const log = new PrefixLogger('(updater)');

let win:Electron.BrowserWindow;

export function checkForUpdates() {
  autoUpdater.autoDownload = false;
  autoUpdater.on('checking-for-update', () => {
    log.info('checking for updates...');
    setUpdateWindowStatus({
      state: 'checking',
      new_version: null,
      releaseNotes: null,
    })
  })
  autoUpdater.on('update-not-available', info => {
    log.info('Update not available');
    setUpdateWindowStatus({
      state: 'not-available',
    })
  })
  autoUpdater.on('update-available', async (info) => {
    log.info('Update available', info.version, info.releaseDate);
    let new_version = info.version;
    let alert_user = true;
    if (new_version === PSTATE.skipVersion) {
      // ignore it
      alert_user = false;
    }
    setUpdateWindowStatus({
      state: 'update-available',
      new_version: new_version,
      releaseNotes: info.releaseNotes,
    }, alert_user)
  })
  autoUpdater.on('error', (err) => {
    log.error(err);
    let alert_user = true;
    if (err.toString.indexOf('net::ERR_INTERNET_DISCONNECTED') !== -1) {
      // They have no internet connection
      alert_user = false;
    }
    setUpdateWindowStatus({
      error: err,
      state: 'idle',
    }, alert_user);
  })
  autoUpdater.on('download-progress', (progress) => {
    log.info('progress', progress);
    setUpdateWindowStatus({
      percent: progress.percent,
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    log.info('update downloaded', info);
    setUpdateWindowStatus({
      state: 'downloaded'
    }, true);
  });

  if (electron_is.linux() && process.env.APPIMAGE === null) {
    linux_checkForUpdates();
  } else {
    autoUpdater.checkForUpdates();
  }
}

export interface IUpdateStatus {
  current_version: string;
  new_version: string;
  releaseNotes: string;
  error: string;
  percent: number;
  state: 'idle' | 'checking' | 'update-available' | 'not-available' | 'downloading' | 'downloaded';
}
export let CURRENT_UPDATE_STATUS:IUpdateStatus = {
  state: 'idle',
  current_version: null,
  new_version: null,
  releaseNotes: null,
  error: null,
  percent: 0,
}
export function setUpdateWindowStatus(status:Partial<IUpdateStatus>, ensureOpen:boolean=false) {
  if (!CURRENT_UPDATE_STATUS.current_version) {
    CURRENT_UPDATE_STATUS.current_version = `v${app.getVersion()}`;
  }
  Object.assign(CURRENT_UPDATE_STATUS, status);
  if (ensureOpen) {
    openUpdateWindow();
  }
  if (win) {
    win.webContents.send('buckets:update-status', CURRENT_UPDATE_STATUS);
  }
}

export function openUpdateWindow() {
  if (win) {
    win.focus();
    return;
  }
  win = new BrowserWindow({
    frame: false,
    width: 350,
    height: 120,
    minWidth: 350,
    minHeight: 120,
    show: false,
  });
  win.once('ready-to-show', () => {
    win.show();
    setUpdateWindowStatus({});
  });
  win.on('close', ev => {
    win = null;
  });
  win.webContents.on('will-navigate', (ev, url) => {
    ev.preventDefault();
    shell.openExternal(url);
  })

  let path = Path.join(APP_ROOT, 'src/wwwroot/misc/updates.html');
  path = `file://${path}`
  win.loadURL(path);
}

if (ipcMain) {
  ipcMain.on('buckets:check-for-updates', () => {
    log.info('check for updates clicked');
    checkForUpdates();
  })
  ipcMain.on('buckets:download-update', () => {
    log.info('download update clicked');
    autoUpdater.downloadUpdate()
    setUpdateWindowStatus({
      state: 'downloading',
    })
  })
  ipcMain.on('buckets:install-update', () => {
    log.info('install update clicked');
    autoUpdater.quitAndInstall();
  })
  ipcMain.on('buckets:skip-version', async (ev, version) => {
    log.info('Skipping version', version);
    await updateState({
      skipVersion: version,
    })
    win.close();
  })
}

export async function linux_checkForUpdates() {
  let new_version = await new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.github.com',
      port: 443,
      path: '/repos/buckets/application/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'Buckets App (hello@budgetwithbuckets.com)',
      }
    }, res => {
      let payload = '';
      res.setEncoding('utf8');
      res.on('data', d => {
        payload += d;
      })
      res.on('end', () => {
        try {
          const data = JSON.parse(payload);
          resolve(data.tag_name);
        } catch(err) {
          log.error(`Error parsing payload: ${err.stack}`)
          resolve(null);
        }
      })
    }).on('error', err => {
      log.error(`Error checking for update: ${err}`)
      resolve(null);
    })
  });
  let current_version = `v${app.getVersion()}`;
  if (new_version && current_version !== new_version) {
    dialog.showMessageBox({
      title: sss('Update Available'),
      message: sss('version-available', (newv:string) => `Version ${newv} available.`)(new_version),
      buttons: [
        sss('Later'),
        sss('Download'),
      ],
      defaultId: 0,
    }, (indexClicked) => {
      if (indexClicked === 1) {
        // Download
        shell.openExternal('https://github.com/buckets/application/releases/latest')
      }
    })
  }
}