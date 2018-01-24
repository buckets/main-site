import { app, remote } from 'electron'
import * as Path from 'path'
import * as fs from 'fs'
import { EventSource } from '../events'
import { onlyRunInMain } from '../rpc'
import { PrefixLogger } from '../logging'

const log = new PrefixLogger('(persistent)');

export interface PersistentState {
  recentFiles: string[];
  firstUseDate: string;
  locale: string;
  skipVersion: string;
  animation: boolean;
}

export let PSTATE:PersistentState = {
  recentFiles: [],
  firstUseDate: null,
  locale: '',
  skipVersion: null,
  animation: true,
};

function loadState():PersistentState {
  log.info('Loading persistent state...');
  let data;
  try {
    data = fs.readFileSync(stateFilename(), 'utf8');  
    try {
      let fromdisk = JSON.parse(data) as PersistentState;
      Object.assign(PSTATE, fromdisk);
    } catch(err) {
      log.error(`Broken state: ${data}`);
    }
  } catch(err) {
    // File probably not present, which is okay
  }
  return PSTATE;
}
loadState();

function stateFilename() {
  let real_app = remote ? remote.app : app;
  return Path.join(real_app.getPath('userData'), 'state.json');
}

export const updateState = onlyRunInMain(async (update:Partial<PersistentState>):Promise<PersistentState> => {
    let new_state = Object.assign(await loadState(), update);
    PSTATE = await new Promise<PersistentState>((resolve, reject) => {
      fs.writeFile(stateFilename(), JSON.stringify(new_state), 'utf8' as any, err => {
        if (err) {
          throw err;
        }
        resolve(new_state);
      })
    });
    return PSTATE;
});

export const PersistEvents = {
  added_recent_file: new EventSource<string>(),
}

export function getRecentFiles():string[] {
  return PSTATE.recentFiles;
}
export async function addRecentFile(path:string) {
  let recent_files = getRecentFiles();
  let idx = recent_files.indexOf(path);
  if (idx !== -1) {
    recent_files.splice(idx, 1);
  }
  recent_files.unshift(path);
  recent_files = recent_files.slice(0, 5);
  await updateState({
    recentFiles: recent_files,
  })
  PersistEvents.added_recent_file.emit(path);
}

