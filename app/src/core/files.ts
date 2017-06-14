import * as Path from 'path';
import * as log from 'electron-log'
import {dialog, BrowserWindow} from 'electron';
import {} from 'bluebird';
import * as sqlite from 'sqlite';
import {APP_ROOT} from '../lib/globals';
import {v4 as uuid} from 'uuid';

interface Registry {
  [k:string]: BudgetFile,
}

export let WIN2FILE:{
  [k:number]: BudgetFile,
}={};

export class BudgetFile {
  static REGISTRY:Registry={};

  readonly id:string;
  private _db:sqlite.Database;
  readonly windows:Array<Electron.BrowserWindow>=[];
  readonly filename:string;
  constructor(filename?:string) {
    this.id = uuid();
    this.filename = filename || '';
    BudgetFile.REGISTRY[this.id] = this;
  }
  async start() {
    log.debug('start', this.filename);

    // start up the database
    this._db = await sqlite.open(this.filename, {promise:Promise})
    log.debug('db opened');

    // upgrade database
    try {
      await this._db.migrate({
        migrationsPath: Path.join(APP_ROOT, 'migrations'),
      })  
    } catch(err) {
      log.error(err.stack);
      throw err;
    }
    
    // open default windows
    this.openDefaultWindows();
    return this;
  }
  async stop() {
    delete BudgetFile.REGISTRY[this.id];
  }
  get db() {
    return this._db;
  }
  openDefaultWindows() {
    // Later, it might save state so that the last thing opened
    // is what opens the next time.  But for now, just start
    // at the top.
    this.openWindow('/budget/index.html');
  }
  openWindow(path:string) {
    log.debug('opening window to', path);
    let win = new BrowserWindow({
      width: 1200,
      height: 900,
    });

    // Link this instance and the window
    this.windows.push(win);
    WIN2FILE[win.id] = this;

    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    let url = `buckets://${this.id}${path}`;
    log.debug('url', url);
    win.loadURL(url);
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

export function openDialog() {
  dialog.showOpenDialog({
    title: 'Open Buckets Budget',
    filters: [
      {name: 'Buckets Budget', extensions: ['buckets']},
    ],
  }, (paths) => {
    if (paths) {
      BudgetFile.openFile(paths[0]);
    }
  })
}

export function newBudgetFileDialog():Promise<BudgetFile> {
  return new Promise((resolve, reject) => {
    dialog.showSaveDialog({
      title: 'Buckets Budget Filename',
      defaultPath: 'mybudget.buckets',
    }, (filename) => {
      resolve(BudgetFile.openFile(filename));
    })
  })
}