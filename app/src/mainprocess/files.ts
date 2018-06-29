import * as Path from 'path'
import * as URL from 'url';
import * as electron_is from 'electron-is'
import * as fs from 'fs-extra-promise'
import * as querystring from 'querystring'
import { app, ipcMain, ipcRenderer, dialog, BrowserWindow } from 'electron';
import {} from 'bluebird';
import { v4 as uuid } from 'uuid';

import { DesktopFunctions } from '../desktop'
import { dumpTS, loadTS, SerializedTimestamp, MaybeMoment } from 'buckets-core/dist/time'
import { SQLiteStore } from 'buckets-core/dist/dbstore';
import { openSqlite } from '../async-sqlite'
import { RPCMainStoreHookup, RPCRendererStore } from '../rpcstore';
import { addRecentFile, PSTATE } from './persistent'
import { reportErrorToUser, displayError } from '../errors'
import { sss } from '../i18n'
import { onlyRunInMain } from '../rpc'
import { importFile, ImportResult } from '../importing'
import { PrefixLogger } from '../logging'
import { SyncResult, MultiSyncer, ASyncening } from 'buckets-core/dist/models/sync'
import { SimpleFINSyncer } from 'buckets-core/dist/models/simplefin'
import { MacroSyncer } from 'buckets-core/dist/models/bankmacro'
import { CSVNeedsMapping, CSVMappingResponse, CSVNeedsAccountAssigned, CSVAssignAccountResponse } from '../csvimport'
import { updateMenu } from './menu'
import { openPreferences } from './prefs'

const log = new PrefixLogger('(files)')

export interface IOpenWindow {
  path: string,
  bounds: Electron.Rectangle,
  focused: boolean,
}

declare module 'buckets-core/dist/store' {
  interface IStoreEvents {
    sync_started: {
      onOrAfter: SerializedTimestamp;
      before: SerializedTimestamp;
    };
    sync_done: {
      onOrAfter: SerializedTimestamp;
      before: SerializedTimestamp;
      result: SyncResult;
    };
    macro_started: {
      id: number;
    };
    macro_stopped: {
      id: number;
    };
    csv_needs_mapping: CSVNeedsMapping;
    csv_mapping_response: CSVMappingResponse;
    csv_needs_account_assigned: CSVNeedsAccountAssigned;
    csv_account_response: CSVAssignAccountResponse;
  }
}

export interface IBudgetFile {
  /**
   *  Get the filename for this budget.
   */
  getFilename():Promise<string>;

  /**
   *  Open a new budget-specific window in an already-open budget.
   *
   *  @param path  Relative path to open
   *  @param hide  If given, don't immediately show this window.  By default, all windows are shown as soon as they are ready.
   *  @param options  Extra BrowserWindow options
   */
  openWindow(path:string, args: {
      hide?: boolean;
      options?: Partial<Electron.BrowserWindowConstructorOptions>;
      bounds?: Electron.Rectangle;
    }):Electron.BrowserWindow
  
  openPreferences();

  /**
   *  Import a transaction-laden file
   */
  importFile(path:string):Promise<ImportResult>;
  openImportFileDialog();

  /**
   *  Start a sync
   */
  startSync(onOrAfter:MaybeMoment, before:MaybeMoment);

  /**
   *  Cancel sync
   */
  cancelSync();
}

interface IBudgetFileRPCMessage {
  reply_ch: string;
  method: string;
  params: any[];
}
interface IBudgetFileRPCResponse {
  result?: any;
  err?: any;
}


//------------------------------------------------------------------------------
// Main process
//------------------------------------------------------------------------------

/**
 *  Main process interface to a single budget file.
 */
export class BudgetFile implements IBudgetFile {
  
  // Mapping of BudgetFile ids to BudgetFiles
  private static REGISTRY:{
    [k:string]: BudgetFile;
  } = {};

  // Mapping of BrowserWindow ids to BudgetFile
  private static WIN2FILE:{
    [win_id:number]: BudgetFile;
  } = {};

  public store:SQLiteStore;
  private rpc_main_hookup:RPCMainStoreHookup = null;

  public running_syncs:ASyncening[] = [];
  private syncer:MultiSyncer;

  readonly id:string;
  readonly filename:string;

  constructor(filename?:string) {
    log.info('opening', filename);
    this.filename = filename || '';
    this.id = uuid();
    BudgetFile.REGISTRY[this.id] = this;
  }

  /**
   *  Open or create a budget file.
   */
  static async openFile(filename:string, args:{
    create?:boolean,
    windows?:Array<IOpenWindow>,
  } = {}):Promise<BudgetFile> {
    if (!args.create) {
      // open the file or fail if it doesn't exist
      if (! await fs.existsAsync(filename)) {
        displayError(sss('File does not exist:') + ` ${filename}`)
        return;
      }
    }
    let bf = new BudgetFile(filename);
    return bf.start(args.windows);
  }

  /**
   *  Get a serializable set of the files and windows currently
   *  open.  Useful for restoring what windows were open before
   *  the application was closed.
   */
  static currentWindowSet() {
    let ret:{
      [filename:string]: Array<IOpenWindow>;
    } = {};
    Object.keys(BudgetFile.WIN2FILE)
    .forEach((win_string:string) => {
      const win_id = Number(win_string)
      const win = BrowserWindow.fromId(win_id);
      const url = win.webContents.getURL();
      const parsed = URL.parse(url);
      if (parsed.pathname.startsWith('/record')) {
        // Don't reopen macro windows
        return;
      }
      const bf = BudgetFile.fromWindowId(win_id);
      const filename = bf.filename;
      if (!ret[filename]) {
        ret[filename] = [];
      }
      ret[filename].push({
        path: `${parsed.path}${parsed.hash}`,
        bounds: win.getBounds(),
        focused: win.isFocused(),
      })
    })
    return ret;
  }

  /**
   *  Get a BudgetFile from its id
   */
  static fromId(id:string):BudgetFile {
    return BudgetFile.REGISTRY[id]
  }

  /**
   *  Get a BudgetFile from a BrowserWindow.id
   */
  static fromWindowId(id:number):BudgetFile {
    return BudgetFile.WIN2FILE[id];
  }

  async getFilename() {
    return this.filename;
  }

  /**
   *  Open the file, hook up all communication channels and event
   *  processors and create windows.
   */
  async start(windows:Array<IOpenWindow>=[]) {
    // connect to database
    try {
      const db = openSqlite(this.filename);
      this.store = new SQLiteStore(db, new DesktopFunctions(this));
      await this.store.doSetup();
    } catch(err) {
      log.error(`Error opening file: ${this.filename}`);
      log.error(err.stack);
      reportErrorToUser(sss('Unable to open the file:') + ` ${this.filename}`, {err});
      return;
    }

    // listen for child renderer processes
    ipcMain.on(`budgetfile.rpc.${this.id}`, async (ev, message:IBudgetFileRPCMessage) => {
      let response:IBudgetFileRPCResponse = {};
      try {
        let func = this[message.method];
        response.result = await func.bind(this)(...message.params);
      } catch(err) {
        log.error('Budget RPC error', message, err);
        response.err = err;
      }
      ev.sender.send(message.reply_ch, response);
    })

    this.syncer = new MultiSyncer([
      new MacroSyncer(this.store),
      new SimpleFINSyncer(this.store),
    ]);

    // listen for child store requests
    this.rpc_main_hookup = new RPCMainStoreHookup(this.store, this.id);
    await this.rpc_main_hookup.start();

    this.store.undo.events.stackchange.on(() => {
      updateMenu({budget: this});
    })

    // mark it as having been opened
    addRecentFile(this.filename);

    // open default windows
    this.openDefaultWindows(windows);
    return this;
  }

  /**
   
   */
  async stop() {
    delete BudgetFile.REGISTRY[this.id];
    this.rpc_main_hookup.stop();
    ipcMain.removeAllListeners(`budgetfile.rpc.${this.id}`)
  }

  /**
   *  Open the "default" set of windows for a newly opened budget.
   */
  async openDefaultWindows(windows:Array<IOpenWindow>=[]) {
    if (windows.length) {
      let promises = [];
      let window_to_focus:Electron.BrowserWindow;
      windows.forEach(window => {
        let win = this.openWindow(window.path, {
          bounds: window.bounds,
        });
        if (window.focused) {
          window_to_focus = win;
        }
        promises.push(new Promise((resolve, reject) => {
          win.once('ready-to-show', () => {
            resolve(true);
          });
        }))
      })
      await Promise.all(promises);
      if (window_to_focus) {
        setTimeout(() => {
          window_to_focus.focus();
        }, 0);
      }
    } else {
      const qs = querystring.stringify({
        args: JSON.stringify({
          noanimation: !PSTATE.animation ? true : undefined,
        })
      })
      this.openWindow(`/budget/index.html?${qs}`);
    }

  }

  /**
   *  Open a new budget-specific window in an already-open budget.
   *
   *  @param path  Relative path to open
   *  @param hide  If given, don't immediately show this window.  By default, all windows are shown as soon as they are ready.
   *  @param options  Extra BrowserWindow options
   */
  openWindow(path:string, args: {
      hide?: boolean;
      options?: Partial<Electron.BrowserWindowConstructorOptions>;
      bounds?: Electron.Rectangle;
    } = {}):Electron.BrowserWindow {
    log.info('opening new window to', path);
    const parsed = Path.parse(this.filename);
    let options:Partial<Electron.BrowserWindowConstructorOptions> = {
      width: 1200,
      height: 900,
      show: false,
      title: `Buckets - ${parsed.name}`,
    }
    options = Object.assign(options, args.options || {})
    let win = new BrowserWindow(options);
    if (!args.hide) {
      win.once('ready-to-show', () => {
        win.show();
      })  
    }

    if (args.bounds) {
      win.setBounds(args.bounds);
    }

    // Link this instance and the window
    BudgetFile.WIN2FILE[win.id] = this;

    let url:string;
    if (path.startsWith('buckets://')) {
      url = path;
    } else {
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      url = `buckets://${this.id}${path}`;  
    }
    
    win.loadURL(url);
    win.on('close', ev => {
      // unlink from this instance
      delete BudgetFile.WIN2FILE[win.id];
    })
    return win;
  }

  openPreferences() {
    openPreferences();
  }

  async importFile(path:string):Promise<ImportResult> {
    try {
      return await importFile(this.store, this, path);  
    } catch(err) {
      reportErrorToUser("Error importing file");
      log.error(`Error importing file: ${path}`);
      log.error(err.stack);
    }
  }

  openImportFileDialog() {
    dialog.showOpenDialog({
      title: sss('Open Transaction File'),
      filters: [
        {name: 'OFX/QFX', extensions: ['ofx', 'qfx']},
        {name: 'CSV', extensions: ['csv']},
      ],
    }, paths => {
      if (paths) {
        paths.forEach(path => {
          this.importFile(path);
        })
      }
    })
  }

  async startSync(onOrAfter:MaybeMoment, before:MaybeMoment) {
    let m_onOrAfter = loadTS(onOrAfter);
    let m_before = loadTS(before);
    let sync = this.syncer.syncTransactions(m_onOrAfter, m_before);
    this.running_syncs.push(sync);
    let p = sync.start();
    this.store.events.broadcast('sync_started', {
      onOrAfter: dumpTS(onOrAfter),
      before: dumpTS(before),
    })
    let result = await p;
    this.running_syncs.splice(this.running_syncs.indexOf(sync), 1);
    this.store.events.broadcast('sync_done', {
      onOrAfter: dumpTS(onOrAfter),
      before: dumpTS(before),
      result,
    })
  }

  cancelSync() {
    this.running_syncs.forEach(sync => {
      sync.cancel();
    })
  }
}


//------------------------------------------------------------------------------
// Renderer
//------------------------------------------------------------------------------

/**
 *  In-renderer interface to a main process `BudgetFile`
 */
class RendererBudgetFile implements IBudgetFile {
  readonly store:RPCRendererStore;

  constructor(readonly id:string) {
    this.store = new RPCRendererStore(id);
  }

  async getFilename() {
    return this.callInMain('getFilename');
  }

  openWindow(path:string, args: {
      hide?: boolean;
      options?: Partial<Electron.BrowserWindowConstructorOptions>;
      bounds?: Electron.Rectangle;
    }) {
    this.callInMain('openWindow', path, args);
    return null;
  }

  openPreferences() {
    return this.callInMain('openPreferences');
  }

  importFile(path:string):Promise<ImportResult> {
    return this.callInMain('importFile', path);
  }
  openImportFileDialog() {
    return this.callInMain('openImportFileDialog');
  }

  startSync(onOrAfter:MaybeMoment, before:MaybeMoment) {
    return this.callInMain('startSync', dumpTS(onOrAfter), dumpTS(before));
  }
  cancelSync() {
    return this.callInMain('cancelSync');
  }

  /**
   *  Call a function on this budget's corresponding main process BudgetFile.
   */
  private callInMain(method:keyof BudgetFile, ...args):Promise<any> {
    return new Promise((resolve, reject) => {
      const message:IBudgetFileRPCMessage = {
        reply_ch: `budgetfile.reply.${uuid()}`,
        method,
        params:args,
      }
      ipcRenderer.once(message.reply_ch, (event, reply:IBudgetFileRPCResponse) => {
        if (reply.err) {
          reject(reply.err)
        } else {
          resolve(reply.result)
        }
      })
      ipcRenderer.send(`budgetfile.rpc.${this.id}`, message);  
    })
  }
}

/**
 *  In renderer processes attached to a particular budget file, this is a RendererBudgetFile instance.
 *
 *  In the main process this is `undefined`
 */
let _current_file:RendererBudgetFile;
export function getCurrentFile() {
  if (!electron_is.renderer()) {
    throw new Error('getCurrentFile may only be called from the renderer processes');
  }
  if (_current_file === undefined) {
    let hostname = window.location.hostname;
    _current_file = new RendererBudgetFile(hostname);
  }
  return _current_file;
}

//------------------------------------------------------------------------------
// Global functions
//------------------------------------------------------------------------------

/**
 *  Open a new window to the same location as the currently focused window
 */
export const duplicateWindow = onlyRunInMain(() => {
  let win = BrowserWindow.getFocusedWindow();
  if (!win) {
    return;
  }
  let bf = BudgetFile.fromWindowId(win.id);
  if (!bf) {
    return;
  }
  let url = win.webContents.getURL();
  bf.openWindow(url);
})

/**
 *  Start the "Open Budget File" dialog
 */
export const openBudgetFileDialog = onlyRunInMain(() => {
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
})

/**
 *  Start the "New Budget File" dialog.
 */
export const newBudgetFileDialog = onlyRunInMain(() => {
  return new Promise((resolve, reject) => {
    dialog.showSaveDialog({
      title: sss('Buckets Budget Filename'/* 'Buckets' refers to the application name */),
      defaultPath: Path.resolve(app.getPath('documents'), 'My Budget.buckets'),
    }, (filename) => {
      if (filename) {
        resolve(BudgetFile.openFile(filename, {create:true}));  
      } else {
        reject(new Error(sss('No file chosen')));
      }
    })
  })
})

/**
 *  Open a budget file (in a new window).
 */
export const openBudgetFile = onlyRunInMain((path:string) => {
  return BudgetFile.openFile(path);
})

