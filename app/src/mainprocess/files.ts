import * as log from 'electron-log'
import * as Path from 'path'
import * as electron_is from 'electron-is'
import * as fs from 'fs-extra-promise'
import * as tmp from 'tmp'
import { ipcMain, dialog, BrowserWindow, session } from 'electron';
import {} from 'bluebird';
import {v4 as uuid} from 'uuid';
import {DBStore} from './dbstore';
import { RPCMainStore } from '../rpcstore';
import * as URL from 'url';
import { addRecentFile } from './persistent'
import { reportErrorToUser, displayError } from '../errors'
import { sss } from '../i18n'
import * as querystring from 'querystring'

interface Registry {
  [k:string]: BudgetFile,
}

export let WIN2FILE:{
  [k:number]: BudgetFile,
}={};

export class BudgetFile {
  static REGISTRY:Registry={};
  public store:DBStore;
  private rpc_store:RPCMainStore = null;

  readonly id:string;
  readonly windows:Array<Electron.BrowserWindow>=[];
  readonly filename:string;
  constructor(filename?:string) {
    this.id = uuid();
    this.filename = filename || '';
    this.store = new DBStore(filename, true);
    BudgetFile.REGISTRY[this.id] = this;
  }
  async start() {
    log.debug('start', this.filename);

    // connect to database
    try {
      await this.store.open();  
    } catch(err) {
      log.error(`Error opening file: ${this.filename}`);
      log.error(err.stack);
      reportErrorToUser(sss('Unable to open the file:') + ` ${this.filename}`, {err});
      return;
    }
    
    this.rpc_store = new RPCMainStore(this.store, this.id);
    await this.rpc_store.start();

    // mark it as having been opened
    addRecentFile(this.filename);

    // open default windows
    this.openDefaultWindows();
    return this;
  }
  async stop() {
    delete BudgetFile.REGISTRY[this.id];
  }
  openDefaultWindows() {
    // Later, it might save state so that the last thing opened
    // is what opens the next time.  But for now, just start
    // at the top.
    this.openWindow(`/budget/index.html`);
  }
  openWindow(path:string, dont_show?:boolean) {
    log.debug('opening window to', path);
    const parsed = Path.parse(this.filename);
    let win = new BrowserWindow({
      width: 1200,
      height: 900,
      show: false,
      title: `Buckets - ${parsed.name}`,
    });
    if (!dont_show) {
      win.once('ready-to-show', () => {
        win.show();
      })  
    }

    // Link this instance and the window
    this.windows.push(win);
    WIN2FILE[win.id] = this;

    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    let url = `buckets://${this.id}${path}`;
    log.debug('url', url);
    win.loadURL(url);
    // win.setRepresentedFilename(this.filename);
    win.on('close', ev => {
      // unlink from this instance
      delete WIN2FILE[win.id];
      let idx = this.windows.indexOf(win);
      this.windows.splice(idx, 1);
    })
  }
  async openRecordWindow(recording_id:number) {
    // XXX use a unique partition per recording per file
    let bankrecording = await this.store.bankrecording.get(recording_id);

    let partition = `persist:${bankrecording.uuid}`;
    let sesh = session.fromPartition(partition, {cache:false});
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
    // console.log('cookies', sesh.cookies);
    sesh.cookies.on('changed', (ev, cookie, cause) => {
      // console.log('cookie changed', ev, cookie, cause);
      sesh.cookies.flushStore(() => {});
    })

    // Downloads
    sesh.on('will-download', (ev, item, webContents) => {
      console.log('will-download', ev, item);

      // XXX does this need to be explicitly cleaned up?
      let tmpdir = tmp.dirSync();
      console.log('tmpdir', tmpdir);

      webContents.send('buckets:will-download', {
        filename: item.getFilename(),
        mimetype: item.getMimeType(),
      })
      // console.log('getFilename', item.getFilename())
      // console.log('mimetype', item.getMimeType());
      // console.log('state', item.getState());
      // console.log('getURL', item.getURL());
      
      let save_path = Path.join(tmpdir.name, item.getFilename());
      
      item.setSavePath(save_path);
      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          console.log('Download is interrupted but can be resumed')
        } else if (state === 'progressing') {
          if (item.isPaused()) {
            console.log('Download is paused')
          } else {
            console.log(`Received bytes: ${item.getReceivedBytes()}`)
          }
        }
      })
      item.once('done', (event, state) => {
        if (state === 'completed') {
          console.log('Download successfully')
          webContents.send('buckets:file-downloaded', {
            localpath: save_path,
            filename: item.getFilename(),
            mimetype: item.getMimeType(),
          })
        } else {
          console.log(`Download failed: ${state}`)
        }
      })
    })

    // Load the url
    const qs = querystring.stringify({
      recording_id,
      partition
    })
    this.openWindow(`/record/record.html?${qs}`);
  }
  static async openFile(filename:string, create:boolean=false):Promise<BudgetFile> {
    if (!create) {
      // open the file and fail if it doesn't exist
      if (! await fs.existsAsync(filename)) {
        displayError(sss('File does not exist:') + ` ${filename}`)
        return;
      }
    }
    let bf = new BudgetFile(filename);
    return bf.start();
  }
}

export function newBudgetWindow() {
  let win = BrowserWindow.getFocusedWindow();
  if (!win) {
    return;
  }
  let bf = WIN2FILE[win.id];
  if (!bf) {
    return;
  }
  let url = win.webContents.getURL();
  let parsed = URL.parse(url);
  bf.openWindow(`${parsed.pathname}${parsed.hash}`);
}

export function openDialog() {
  dialog.showOpenDialog({
    title: sss('Open Buckets Budget'),
    filters: [
      {name: sss('budget-file-type-name', 'Buckets Budget'), extensions: ['buckets']},
    ],
  }, (paths) => {
    if (paths) {
      paths.forEach(path => {
        BudgetFile.openFile(path);
      })
    }
  })
}

export function newBudgetFileDialog():Promise<BudgetFile> {
  return new Promise((resolve, reject) => {
    dialog.showSaveDialog({
      title: sss('Buckets Budget Filename'),
      defaultPath: 'My Budget.buckets',
    }, (filename) => {
      if (filename) {
        resolve(BudgetFile.openFile(filename, true));  
      } else {
        reject(new Error(sss('No file chosen')));
      }
    })
  })
}

export function watchForEvents(app:Electron.App) {
  ipcMain.on('buckets:new-budget', async () => {
    try {
      await newBudgetFileDialog()
    } catch(err) {

    }
  })
  ipcMain.on('buckets:open-file-dialog', () => {
    openDialog();
  })
  ipcMain.on('buckets:open-file', (ev, path) => {
    BudgetFile.openFile(path);
  })
  ipcMain.on('buckets:open-recorder', (ev, args) => {
    const file = WIN2FILE[ev.sender.id];
    log.info('opening recording', file.filename, 'recording', args.recording_id);
    file.openRecordWindow(args.recording_id);
  })
}
