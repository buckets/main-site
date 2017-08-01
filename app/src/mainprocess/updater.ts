import * as log from 'electron-log'
import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

export function checkForUpdates() {
  let DO_UPDATE = false;
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
      message: 'A free update is available for Buckets',
      detail: `Current version: ${app.getVersion()}\nNew version: ${new_version}`,
      buttons: [
        'Later',
        'Download, Update and Restart',
      ],
      defaultId: 0,
    }, (indexClicked) => {
      if (indexClicked === 1) {
        // Download and restart
        autoUpdater.downloadUpdate()
        DO_UPDATE = true;
      }
    })
  })
  autoUpdater.on('error', (err) => {
    log.error(err);
  })
  autoUpdater.on('update-downloaded', (info) => {
    if (DO_UPDATE) {
      autoUpdater.quitAndInstall();
    }
  });
  autoUpdater.checkForUpdates();
}
