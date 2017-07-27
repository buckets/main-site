import { app, remote, ipcMain, ipcRenderer } from 'electron'
import * as electron_is from 'electron-is'
import * as Path from 'path'
import * as fs from 'fs'
import { updateMenu } from './menu'

interface PersistentState {
  recentFiles: string[];
}

function stateFilename() {
  let real_app = remote ? remote.app : app;
  return Path.join(real_app.getPath('userData'), 'state.json');
}

async function readState():Promise<PersistentState> {
  let p = new Promise<PersistentState>((resolve, reject) => {
    fs.readFile(stateFilename(), 'utf8', (err, data) => {
      let result:PersistentState;
      if (err) {
        result = {
          recentFiles: [],
        }
      } else {
        result = JSON.parse(data) as PersistentState;
      }
      resolve(result);
    });
  });
  return p;
}

export async function modifyState(func:(state:PersistentState)=>(Promise<PersistentState>|PersistentState)):Promise<PersistentState> {
  let state = await readState();
  let new_state = await func(state);
  if (electron_is.renderer()) {
    ipcRenderer.send('persistent:updateState', new_state);
    return new_state;
  } else {
    return new Promise<PersistentState>((resolve, reject) => {
      fs.writeFile(stateFilename(), JSON.stringify(new_state), 'utf8', err => {
        if (err) {
          throw err;
        }
        resolve(new_state);
      })
    })
  }
}

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
  return updateMenu();
}

if (electron_is.main()) {
  ipcMain.on('persistent:updateState', (new_state:PersistentState) => {
    modifyState(state => {
      return new_state;
    })
  })
}