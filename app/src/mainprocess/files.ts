import * as log from 'electron-log'
import * as Path from 'path'
import * as fs from 'fs-extra-promise'
import { ipcMain, dialog, BrowserWindow, session } from 'electron';
import {} from 'bluebird';
import {v4 as uuid} from 'uuid';
import {DBStore} from './dbstore';
import {RPCMainStore} from '../rpc';
import * as URL from 'url';
import { addRecentFile } from './persistent'
import { reportErrorToUser, displayError } from '../errors'
import { sss } from '../i18n'

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
  openWindow(path:string) {
    log.debug('opening window to', path);
    const parsed = Path.parse(this.filename);
    let win = new BrowserWindow({
      width: 1200,
      height: 900,
      show: false,
      title: `Buckets - ${parsed.name}`,
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
  openRecordWindow() {
    let sesh = session.fromPartition('persist:recordtest2', {cache:false});
    sesh.clearCache(() => {

    });
    sesh.on('will-download', (ev, item, webContents) => {
      console.log('will-download', ev, item);
      console.log('getFilename', item.getFilename())
      console.log('mimetype', item.getMimeType());
      console.log('state', item.getState());
      console.log('getURL', item.getURL());
      ev.preventDefault();
    })
    this.openWindow('/record/record.html');
  }
  static async openFile(filename:string, create:boolean=false):Promise<BudgetFile> {
    if (!create) {
      // open, don't create
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
  ipcMain.on('buckets:open-recorder', (ev) => {
    const file = WIN2FILE[ev.sender.id];
    file.openRecordWindow();
  })
}
