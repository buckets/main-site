import * as Path from 'path'
import * as URL from 'url';
import * as electron_is from 'electron-is'
import * as fs from 'fs-extra-promise'
import * as tmp from 'tmp'
import * as querystring from 'querystring'
import { app, ipcMain, ipcRenderer, dialog, BrowserWindow, session } from 'electron';
import {} from 'bluebird';
import { v4 as uuid } from 'uuid';

import { Timestamp, serializeTimestamp, ensureLocalMoment } from '../time'
import { IBudgetBus, BudgetBus, BudgetBusRenderer } from '../store'
import { DBStore } from './dbstore';
import { RPCMainStore, RPCRendererStore } from '../rpcstore';
import { addRecentFile } from './persistent'
import { reportErrorToUser, displayError } from '../errors'
import { sss } from '../i18n'
import { onlyRunInMain, Room } from '../rpc'
import { importFile, ImportResult } from '../importing'
import { PrefixLogger } from '../logging'
import { SyncResult, MultiSyncer, ASyncening } from '../sync'
import { SimpleFINSyncer } from '../models/simplefin'
import { MacroSyncer } from '../models/bankmacro'
import { CSVNeedsMapping, CSVMappingResponse, CSVNeedsAccountAssigned, CSVAssignAccountResponse } from '../csvimport'

const log = new PrefixLogger('(files)')

interface BudgetFileEvents {
  sync_started: {
    onOrAfter: string;
    before: string;
  };
  sync_done: {
    onOrAfter: string;
    before: string;
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

export interface IBudgetFile {
  bus:IBudgetBus;

  room: Room<BudgetFileEvents>;
  
  /**
   *  Cause the recording window to open for a particular recording
   */
  openRecordWindow(macro_id:number, autoplay?:{
    onOrAfter: Timestamp,
    before: Timestamp,
  }):Promise<SyncResult>;
  
  /**
   *  Import a transaction-laden file
   */
  importFile(path:string):Promise<ImportResult>;
  openImportFileDialog();

  /**
   *  Start a sync
   */
  startSync(onOrAfter:Timestamp, before:Timestamp);

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

  public store:DBStore;
  private rpc_store:RPCMainStore = null;
  
  readonly bus:BudgetBus;
  readonly room:Room<BudgetFileEvents>;

  public running_syncs:ASyncening[] = [];
  private syncer:MultiSyncer;

  readonly id:string;
  readonly filename:string;
  constructor(filename?:string) {
    log.info('opening', filename);
    this.id = uuid();
    this.room = new Room<BudgetFileEvents>(this.id);
    this.filename = filename || '';
    this.bus = new BudgetBus(this.id);
    this.store = new DBStore(filename, this.bus, true);
    this.syncer = new MultiSyncer([
      new MacroSyncer(this.store, this),
      new SimpleFINSyncer(this.store),
    ]);
    BudgetFile.REGISTRY[this.id] = this;
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

  /**

   */
  async start() {
    // connect to database
    try {
      await this.store.open();  
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

    // listen for child store requests
    this.rpc_store = new RPCMainStore(this.store, this.id);
    await this.rpc_store.start();

    // mark it as having been opened
    addRecentFile(this.filename);

    // open default windows
    this.openDefaultWindows();
    return this;
  }

  /**
   
   */
  async stop() {
    delete BudgetFile.REGISTRY[this.id];
    this.rpc_store.stop();
    ipcMain.removeAllListeners(`budgetfile.rpc.${this.id}`)
  }

  /**
   *  Open the "default" set of windows for a newly opened budget.
   *
   *  Currently, this just opens the accounts page, but in the future
   *  It might open the set of last-opened windows.
   */
  openDefaultWindows() {
    this.openWindow(`/budget/index.html`);
  }

  /**
   *  Open a new budget-specific window.
   *
   *  @param path  Relative path to open
   *  @param hide  If given, don't immediately show this window.  By default, all windows are shown as soon as they are ready.
   *  @param options  Extra BrowserWindow options
   */
  openWindow(path:string, args: {
      hide?: boolean;
      options?: Partial<Electron.BrowserWindowConstructorOptions>;
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

    // Link this instance and the window
    BudgetFile.WIN2FILE[win.id] = this;

    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    let url = `buckets://${this.id}${path}`;
    win.loadURL(url);
    // win.setRepresentedFilename(this.filename);
    win.on('close', ev => {
      // unlink from this instance
      delete BudgetFile.WIN2FILE[win.id];
    })
    return win;
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
  /**
   *
   */
  async openRecordWindow(macro_id:number, autoplay?:{
    onOrAfter: Timestamp,
    before: Timestamp,
  }) {
    let win:Electron.BrowserWindow;
    const bankmacro = await this.store.bankmacro.get(macro_id);

    const partition = `persist:rec-${bankmacro.uuid}`;
    this.ensureSession(partition);

    let response_id:string;
    let hide:boolean = false;
    if (autoplay) {
      autoplay.onOrAfter = serializeTimestamp(autoplay.onOrAfter)
      autoplay.before = serializeTimestamp(autoplay.before)
      response_id = uuid();
      hide = true;
      this.room.broadcast('macro_started', {id: macro_id});
    }

    // Load the url
    const qs = querystring.stringify({
      macro_id,
      partition,
      response_id,
      autoplay: JSON.stringify(autoplay),
    })
    win = this.openWindow(`/record/record.html?${qs}`, {
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
          this.room.broadcast('macro_stopped', {id: macro_id});
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

  static async openFile(filename:string, create:boolean=false):Promise<BudgetFile> {
    if (!create) {
      // open the file or fail if it doesn't exist
      if (! await fs.existsAsync(filename)) {
        displayError(sss('File does not exist:') + ` ${filename}`)
        return;
      }
    }
    let bf = new BudgetFile(filename);
    return bf.start();
  }


  async startSync(onOrAfter:Timestamp, before:Timestamp) {
    let m_onOrAfter = ensureLocalMoment(onOrAfter);
    let m_before = ensureLocalMoment(before);
    let sync = this.syncer.syncTransactions(m_onOrAfter, m_before);
    this.running_syncs.push(sync);
    let p = sync.start();
    this.room.broadcast('sync_started', {
      onOrAfter: serializeTimestamp(onOrAfter),
      before: serializeTimestamp(m_before),
    })
    let result = await p;
    this.running_syncs.splice(this.running_syncs.indexOf(sync), 1);
    this.room.broadcast('sync_done', {
      onOrAfter: serializeTimestamp(onOrAfter),
      before: serializeTimestamp(m_before),
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
  readonly bus:BudgetBusRenderer;
  readonly room:Room<BudgetFileEvents>;
  readonly store:RPCRendererStore;
  constructor(readonly id:string) {
    this.bus = new BudgetBusRenderer(id);
    this.store = new RPCRendererStore(id, this.bus);
    this.room = new Room<BudgetFileEvents>(this.id);
  }

  async openRecordWindow(macro_id:number, autoplay?:{
    onOrAfter: Timestamp,
    before: Timestamp,
  }) {
    try {
      if (autoplay) {
        autoplay.before = serializeTimestamp(autoplay.before);
        autoplay.onOrAfter = serializeTimestamp(autoplay.onOrAfter);
      }
      return await this.callInMain('openRecordWindow', macro_id, autoplay) 
    } catch(err) {
      log.error(err.stack)
      log.error(err);
    }
  }

  importFile(path:string):Promise<ImportResult> {
    return this.callInMain('importFile', path);
  }
  openImportFileDialog() {
    return this.callInMain('openImportFileDialog');
  }

  startSync(onOrAfter:Timestamp, before:Timestamp) {
    return this.callInMain('startSync', serializeTimestamp(onOrAfter), serializeTimestamp(before));
  }
  cancelSync() {
    return this.callInMain('cancelSync');
  }

  /**
   *  Call a function on this budget's corresponding main process BudgetFile.
   */
  private callInMain(method:keyof IBudgetFile, ...args):Promise<any> {
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
export let current_file:RendererBudgetFile;
if (electron_is.renderer()) {
  let hostname = window.location.hostname;
  current_file = new RendererBudgetFile(hostname);
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
  let parsed = URL.parse(url);
  bf.openWindow(`${parsed.pathname}${parsed.hash}`);
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
      title: sss('Buckets Budget Filename'),
      defaultPath: Path.resolve(app.getPath('documents'), 'My Budget.buckets'),
    }, (filename) => {
      if (filename) {
        resolve(BudgetFile.openFile(filename, true));  
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

