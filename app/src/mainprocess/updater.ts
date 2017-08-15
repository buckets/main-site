import * as log from 'electron-log'
import * as electron_is from 'electron-is'
import * as https from 'https'
import { shell, app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

export function checkForUpdates() {
  autoUpdater.autoDownload = false;
  autoUpdater.on('checking-for-update', () => {
    log.info('checking for updates...');
  })
  autoUpdater.on('update-not-available', info => {
    log.info('update not available', info);
  })
  autoUpdater.on('update-available', (info) => {
    log.info('update available', info);
    let new_version = info.version;
    dialog.showMessageBox({
      title: 'Update Available',
      message: `Version ${new_version} of Buckets is available.`,
      detail: `After downloading the update you will be prompted before it is installed to allow you to finish your work.`,
      buttons: [
        'Later',
        'Download Update',
      ],
      defaultId: 0,
    }, (indexClicked) => {
      if (indexClicked === 1) {
        // Download and restart
        autoUpdater.downloadUpdate()
      }
    })
  })
  autoUpdater.on('error', (err) => {
    log.error(err);
  })
  autoUpdater.on('update-downloaded', (info) => {
    log.info('update downloaded', info);
    dialog.showMessageBox({
      title: 'Update Downloaded',
      message: 'The update is downloaded.  When do you want to quit Buckets and install it?',
      buttons: [
        'Later, After I Quit',
        'Now',
      ],
      defaultId: 1,
    }, (indexClicked) => {
      if (indexClicked === 1) {
        // Do it now
        autoUpdater.quitAndInstall();
      } else {
        // Do it later
        app.once('before-quit', ev => {
          ev.preventDefault();
          autoUpdater.quitAndInstall();
        })
      }
    })
  });

  if (electron_is.linux()) {
    linux_checkForUpdates();
  } else {
    autoUpdater.checkForUpdates();
  }
}


export async function linux_checkForUpdates() {
  let new_version = await new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.github.com',
      port: 443,
      path: '/repos/buckets/application/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'Buckets App (hello@bucketsisbetter.com)',
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
      title: 'Update Available',
      message: `Version ${new_version} of Buckets is available.`,
      buttons: [
        'Later',
        'Download',
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