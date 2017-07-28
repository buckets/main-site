import * as log from 'electron-log'
import { ipcMain, dialog, BrowserWindow } from 'electron';
import {} from 'bluebird';
import {v4 as uuid} from 'uuid';
import {DBStore} from './dbstore';
import {RPCMainStore} from '../rpc';
import * as URL from 'url';
import { addRecentFile } from './persistent'

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
    this.store = new DBStore(filename);
    BudgetFile.REGISTRY[this.id] = this;
  }
  async start() {
    log.debug('start', this.filename);

    addRecentFile(this.filename);

    // connect to database
    await this.store.open();
    this.rpc_store = new RPCMainStore(this.store, this.id);
    await this.rpc_store.start();

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
  openWindow(path:string) {
    log.debug('opening window to', path);
    let win = new BrowserWindow({
      width: 1200,
      height: 900,
      show: false,
    });
    win.once('ready-to-show', () => {
      win.show();
    })

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
  static openFile(filename:string):Promise<BudgetFile> {
    let bf = new BudgetFile(filename);
    return bf.start();
  }
}

export function newBudgetWindow() {
  let win = BrowserWindow.getFocusedWindow();
  let bf = WIN2FILE[win.id];
  let url = win.webContents.getURL();
  let parsed = URL.parse(url);
  bf.openWindow(`${parsed.pathname}${parsed.hash}`);
}

export function openDialog() {
  dialog.showOpenDialog({
    title: 'Open Buckets Budget',
    filters: [
      {name: 'Buckets Budget', extensions: ['buckets']},
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
      title: 'Buckets Budget Filename',
      defaultPath: 'My Budget.buckets',
    }, (filename) => {
      if (filename) {
        resolve(BudgetFile.openFile(filename));  
      } else {
        reject(new Error('No file chosen'));
      }
    })
  })
}

export function watchForEvents(app:Electron.App) {
  ipcMain.on('new-budget', async () => {
    try {
      await newBudgetFileDialog()
    } catch(err) {

    }
  })
  ipcMain.on('open-file-dialog', () => {
    openDialog();
  })
  ipcMain.on('open-file', (ev, path) => {
    BudgetFile.openFile(path);
  })
}
