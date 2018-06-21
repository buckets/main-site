import * as fs from 'fs-extra-promise'

/**
 *  Return a nice stat of a path
 */
export function getNiceStat(path:string) {
  return {
    readable: isPathReadable(path),
    writeable: isPathWriteable(path),
    executable: isPathExecutable(path),
    exists: doesPathExist(path),
  }
}

export function doesPathExist(path:string) {
  try {
    fs.accessSync(path, fs.constants.F_OK)
    return true;
  } catch(err) {
    return false;
  }
}

export function isPathWriteable(path:string) {
  try {
    fs.accessSync(path, fs.constants.W_OK)
    return true;
  } catch(err) {
    return false;
  }
}

export function isPathReadable(path:string) {
  try {
    fs.accessSync(path, fs.constants.R_OK)
    return true;
  } catch(err) {
    return false;
  }
}

export function isPathExecutable(path:string) {
  try {
    fs.accessSync(path, fs.constants.X_OK)
    return true;
  } catch(err) {
    return false;
  }
}