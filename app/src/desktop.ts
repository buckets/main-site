import * as Path from 'path'
import * as querystring from 'querystring'
import { dialog, session, ipcMain } from 'electron'
import * as tmp from 'tmp'
import * as electron_is from 'electron-is'
import { v4 as uuid } from 'uuid';

import { IStore, IUserInterfaceFunctions } from 'buckets-core/dist/store'
import { importYNAB4 } from 'buckets-core/dist/models/ynab'
import { SyncResult } from 'buckets-core/dist/models/sync'
import { dumpTS, MaybeMoment } from 'buckets-core/dist/time'

import { IBudgetFile } from './mainprocess/files'
import { sss } from './i18n'
import { reportErrorToUser } from './errors'
import { PrefixLogger } from './logging'
import { getPassword } from './passwords'

const log = new PrefixLogger('(desktop)');

/**
 *  Electron implementation of UI functions
 */
export class DesktopFunctions implements IUserInterfaceFunctions {
  private store:IStore;

  constructor(private budgetfile:IBudgetFile) {

  }
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

  getPassword(opts: {
    pwkey: string;
    prompt: string;
    error_message?:string;
  }):Promise<string> {
    return getPassword(opts.pwkey, {
      prompt: opts.prompt,
      error: opts.error_message,
    })
  }

  private _sessions:{
    [parition:string]: Electron.Session,
  } = {};
  ensureSession(partition:string):Electron.Session {
    if (!this._sessions[partition]) {
      log.info('Creating session for partition', partition);
      let sesh = session.fromPartition(partition, {cache:false});
      this._sessions[partition] = sesh;
      
      sesh.clearCache(() => {
      });

      // User-Agent
      let user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
      if (electron_is.macOS()) {
        user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';
      } else if (electron_is.windows()) {
        user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';
      } else {
        // linux
        user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'
      }
      sesh.setUserAgent(user_agent);
      
      // Cookies
      sesh.cookies.on('changed', (ev, cookie, cause) => {
        sesh.cookies.flushStore(() => {});
      })

      // Downloads
      sesh.on('will-download', (ev, item, webContents) => {
        let dlid = uuid();
        let logger = new PrefixLogger(`(dl ${dlid})`);
        logger.info(`will-download`, item.getFilename(), item.getMimeType());

        // XXX does this need to be explicitly cleaned up?
        let tmpdir = tmp.dirSync();

        // webContents.send('buckets:will-download', {
        //   filename: item.getFilename(),
        //   mimetype: item.getMimeType(),
        // })
        // console.log('getFilename', item.getFilename())
        // console.log('mimetype', item.getMimeType());
        // console.log('state', item.getState());
        // console.log('getURL', item.getURL());
        
        let save_path = Path.join(tmpdir.name, item.getFilename());
        logger.info(`saving ${item.getFilename()} to ${save_path}`);
        
        item.setSavePath(save_path);
        item.on('updated', (event, state) => {
          if (state === 'interrupted') {
            logger.info(`${state} - Download is interrupted but can be resumed`)
          } else if (state === 'progressing') {
            if (item.isPaused()) {
              logger.info(`${state} - Download is paused`)
            } else {
              logger.info(`${state} - received bytes: ${item.getReceivedBytes()}`)
            }
          }
        })
        item.once('done', async (event, state) => {
          if (state === 'completed') {
            logger.info(`Downloaded`);
            
            // Tell the renderer or webview's parent about the download
            let wc = webContents.hostWebContents || webContents;
            wc.send('buckets:file-downloaded', {
              localpath: save_path,
              filename: item.getFilename(),
              mimetype: item.getMimeType(),
            })
          } else {
            logger.warn(`Download failed: ${state}`)
          }
        })
      })
    }
    return this._sessions[partition];
  }
  async openBankMacroBrowser(macro_id:number, autoplay?:{
    onOrAfter: MaybeMoment;
    before: MaybeMoment;
  }):Promise<SyncResult> {
    let win:Electron.BrowserWindow;
    const bankmacro = await this.store.sub.bankmacro.get(macro_id);

    const partition = `persist:rec-${bankmacro.uuid}`;
    this.ensureSession(partition);

    let response_id:string;
    let hide:boolean = false;
    let serialized_autoplay;
    if (autoplay) {
      response_id = uuid();
      hide = true;
      this.store.events.broadcast('macro_started', {id: macro_id});
      serialized_autoplay = JSON.stringify({
        onOrAfter: dumpTS(autoplay.onOrAfter),
        before: dumpTS(autoplay.before),
      })
    }

    // Load the url
    const qs = querystring.stringify({
      macro_id,
      partition,
      response_id,
      autoplay: serialized_autoplay,
    })
    win = this.budgetfile.openWindow(`/record/record.html?${qs}`, {
      hide,
      options: {
        width: 1100,
        height: 800,
      }
    });
    
    if (autoplay) {
      return new Promise<SyncResult>((resolve, reject) => {
        ipcMain.once('buckets:playback-response', (ev:Electron.IpcMessageEvent, message:SyncResult) => {
          if (!message.errors.length) {
            log.info('closing macro window', win.id);
            win.close();  
          }
          this.store.events.broadcast('macro_stopped', {id: macro_id});
          resolve(message);
        })
      })
    } else {
      return Promise.resolve<SyncResult>({
        errors: [],
        imported_count: 0,
      });
    }
  }
}