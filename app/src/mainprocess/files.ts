import * as log from 'electron-log'
import * as Path from 'path'
import * as electron_is from 'electron-is'
import * as fs from 'fs-extra-promise'
import * as tmp from 'tmp'
import { app, ipcMain, ipcRenderer, dialog, BrowserWindow, session } from 'electron';
import {} from 'bluebird';
import { v4 as uuid } from 'uuid';
import { DBStore } from './dbstore';
import { RPCMainStore } from '../rpcstore';
import * as URL from 'url';
import { addRecentFile } from './persistent'
import { reportErrorToUser, displayError } from '../errors'
import { sss } from '../i18n'
import * as querystring from 'querystring'
import { onlyRunInMain } from '../rpc'


interface IBudgetFile {
  openRecordWindow(recording_id:number);
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

  readonly id:string;
  readonly filename:string;
  constructor(filename?:string) {
    this.id = uuid();
    this.filename = filename || '';
    this.store = new DBStore(filename, true);
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
    BudgetFile.WIN2FILE[win.id] = this;

    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    let url = `buckets://${this.id}${path}`;
    log.debug('url', url);
    win.loadURL(url);
    // win.setRepresentedFilename(this.filename);
    win.on('close', ev => {
      // unlink from this instance
      delete BudgetFile.WIN2FILE[win.id];
    })
  }
  async openRecordWindow(recording_id:number) {
    let bankrecording = await this.store.bankrecording.get(recording_id);

    const partition = `persist:rec-${bankrecording.uuid}`;
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
      log.info('will-download', item.getFilename(), item.getMimeType());

      // XXX does this need to be explicitly cleaned up?
      let tmpdir = tmp.dirSync();
      log.debug('tmp dir:', tmpdir);

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
          log.info('Download is interrupted but can be resumed')
        } else if (state === 'progressing') {
          if (item.isPaused()) {
            log.info('Download is paused')
          } else {
            log.debug(`Received bytes: ${item.getReceivedBytes()}`)
          }
        }
      })
      item.once('done', (event, state) => {
        if (state === 'completed') {
          log.info('Download ok', item.getFilename(), save_path);
          webContents.send('buckets:file-downloaded', {
            localpath: save_path,
            filename: item.getFilename(),
            mimetype: item.getMimeType(),
          })
        } else {
          log.warn(`Download failed: ${state}`)
        }
      })
    })

    // Load the url
    const qs = querystring.stringify({
      recording_id,
      partition
    })
    this.openWindow(`/record/record.html?${qs}`, true);
  }


  /**
   *
   */
  openRecorder(recording_id:number) {

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


//------------------------------------------------------------------------------
// Renderer
//------------------------------------------------------------------------------

/**
 *  In-renderer interface to a main process `BudgetFile`
 */
class RendererBudgetFile implements IBudgetFile {
  constructor(readonly id:string) {
  }
  async openRecordWindow(recording_id:number) {
    try {
      await this.callInMain('openRecordWindow', recording_id)  
    } catch(err) {
      log.error(err.stack)
      log.error(err);
    }
  }
  private callInMain(method:string, ...args):Promise<any> {
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


export function watchForEvents(app:Electron.App) {
  ipcMain.on('buckets:show-window', (ev) => {
    BrowserWindow.fromWebContents(ev.sender).show();
  })
  ipcMain.on('buckets:close-window', (ev) => {
    BrowserWindow.fromWebContents(ev.sender).close();
  })
}
