import { dialog } from 'electron'
import { sss } from './i18n'
import { IStore, IUserInterfaceFunctions } from 'buckets-core/dist/store'
import { importYNAB4 } from 'buckets-core/dist/models/ynab'
import { reportErrorToUser } from './errors'
import { PrefixLogger } from './logging'

const log = new PrefixLogger('(desktop)');

export class DesktopFunctions implements IUserInterfaceFunctions {
  private store:IStore;
  attachStore(store:IStore) {
    this.store = store;
  }

  promptToStartYNABImport() {
    return new Promise((resolve, reject) => {
      dialog.showOpenDialog({
        title: sss('Open YNAB4 File'),
        properties: ['openFile', 'openDirectory'],
        filters: [
          {
            name: 'YNAB',
            extensions: ['ynab4'],
          }
        ],
      }, async (paths) => {
        if (paths) {
          for (let path of paths) {
            try {
              await importYNAB4(this.store, path);
            } catch(err) {
              log.error(err.stack);
              reportErrorToUser(sss('Error importing'), {err: err});
            }
          }
          resolve(null)
        } else {
          reject(null)
        }
      })
    });
  }
}