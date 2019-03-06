import * as _ from 'lodash'
import * as shajs from 'sha.js'
import * as bucketslib from 'bucketslib'

export function isNil(x:any):boolean {
  return x === null || x === undefined;
}

/**
 *  Hash a list of strings in a consistent way.
 */
export function hashStrings(strings:string[]):string {
  let ret = shajs('sha256');
  strings.forEach(s => {
    let hash = shajs('sha256');
    hash.update(s)
    ret.update(hash.digest('hex'))
  });
  return ret.digest('hex');
}

/**
 *  Deep inequality comparison
 */
export function isDifferent(a:any, b:any) {
  return !_.isEqual(a, b);
}

/**
 *  Sleep this thread for a number of milliseconds
 *  This is just for debugging stuff.
 */
export function debugSleep(milli:number) {
  const now = new Date().getTime();
  while (new Date().getTime() < now + milli) {
    // wait
  }
}

/**
 *  Return the bucktslib core version
 */
export function coreVersion():string {
  return bucketslib.version();
}
