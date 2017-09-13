import { app, remote, ipcMain, ipcRenderer } from 'electron'
import * as electron_is from 'electron-is'
import * as Path from 'path'
import * as fs from 'fs'
import * as log from 'electron-log'
import { EventEmitter } from 'events'

export interface PersistentState {
  recentFiles: string[];
  firstUseDate: string;
  locale: string;
}

function stateFilename() {
  let real_app = remote ? remote.app : app;
  return Path.join(real_app.getPath('userData'), 'state.json');
}

export async function readState():Promise<PersistentState> {
  let p = new Promise<PersistentState>((resolve, reject) => {
    fs.readFile(stateFilename(), 'utf8', (err, data) => {
      let result:PersistentState = {
        recentFiles: [],
        firstUseDate: null,
        locale: '',
      };
      if (!err) {
        try {
          let fromdisk = JSON.parse(data) as PersistentState;  
          Object.assign(result, fromdisk);
        } catch(err) {
          log.error(`Broken state: ${data}`)
        }
      }
      resolve(result);
    });
  });
  return p;
}

function serialize<T>(func:(...args)=>(T|Promise<T>)):(...args)=>Promise<T> {
  let queue = [];
  let running = false;
  return (...args) => {
    return new Promise(async (resolve, reject) => {
      queue.push({args, resolve, reject})
      if (running) {
        return;
      }
      running = true;
      while (queue.length) {
        let call = queue.shift();
        try {
          call.resolve(await func(...call.args));
        } catch(err) {
          call.reject(err);
        }
      }
      running = false;
    })
  }
}

async function _modifyState(func:(state:PersistentState)=>(Promise<PersistentState>|PersistentState)):Promise<PersistentState> {
  let state = await readState();
  let new_state = await func(state);
  if (electron_is.renderer()) {
    ipcRenderer.send('persistent:updateState', new_state);
    return new_state;
  } else {
    return new Promise<PersistentState>((resolve, reject) => {
      fs.writeFile(stateFilename(), JSON.stringify(new_state), 'utf8' as any, err => {
        if (err) {
          throw err;
        }
        resolve(new_state);
      })
    })
  }
}
export let modifyState = serialize(_modifyState);

export const PersistEvents = new EventEmitter();

export async function getRecentFiles():Promise<string[]> {
  return (await readState()).recentFiles;
}
export async function addRecentFile(path:string) {
  let recent_files = await getRecentFiles();
  let idx = recent_files.indexOf(path);
  if (idx !== -1) {
    recent_files.splice(idx, 1);
  }
  recent_files.unshift(path);
  recent_files = recent_files.slice(0, 5);
  await modifyState(state => {
    state.recentFiles = recent_files;
    return state;
  })
  PersistEvents.emit('added-recent-file', path);
}

if (electron_is.main()) {
  ipcMain.on('persistent:updateState', (ev, new_state:PersistentState) => {
    modifyState(state => {
      return new_state;
    })
  })
}