import * as os from 'os'
import { app, remote } from 'electron'
import * as electron_is from 'electron-is'
import * as Path from 'path'
import * as fs from 'fs'
import { EventSource } from '@iffycan/events'
import { onlyRunInMain } from '../rpc'
import { PrefixLogger } from '../logging'
import { IOpenWindow } from './files'
import { getNiceStat } from '../util'

const log = new PrefixLogger(electron_is.renderer() ? '(persistent.r)' : '(persistent)');

export interface PersistentState {
  recentFiles: string[];
  firstUseDate: string;
  locale: string;
  number_format: ''|'comma-period'|'period-comma';
  skipVersion: string;
  animation: boolean;
  download_beta_versions: boolean;
  last_opened_windows: Array<{
    filename: string;
    windows: Array<IOpenWindow>;
  }>;
  timezone: string;
}

export let PSTATE:PersistentState = {
  recentFiles: [],
  firstUseDate: null,
  locale: '',
  number_format: '',
  skipVersion: null,
  animation: true,
  download_beta_versions: false,
  last_opened_windows: [],
  timezone: '',
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
    let new_state = Object.assign({}, PSTATE, update);
    PSTATE = await new Promise<PersistentState>((resolve, reject) => {
      const filename = stateFilename();
      fs.writeFile(filename, JSON.stringify(new_state, null, 2), 'utf8' as any, err => {
        if (err) {
          log.error(`Error writing ${filename}`);
          log.info(`user=${JSON.stringify(os.userInfo())}`);
          log.info(`platform=${process.platform}`);
          log.info(`release=${os.release()}`);
          log.info(`arch=${process.arch}`);
          const real_app = remote ? remote.app : app;
          logStat(filename)
          logStat(real_app.getPath('userData'))
          logStat(real_app.getPath('appData'))
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

/**
 *  Log the stat output for a path
 */
function logStat(path:string) {
  try {
    const stat = JSON.stringify(fs.statSync(path));
    const nicestat = JSON.stringify(getNiceStat(path));
    log.info(`stat of ${path}`);
    log.info(nicestat);
    log.info(stat);  
  } catch(err2) {
    log.info(`Error doing stat of ${path}`);
  }
}

/**
 *  Return a list of recently opened files, but only those that *  are accessible.
 */
export function getRecentFiles():string[] {
  return PSTATE.recentFiles.filter(x => {
    try {
      fs.accessSync(x);
      return true;
    } catch(err) {
      return false;
    }
  });
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

