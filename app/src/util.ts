import * as _ from 'lodash'
import * as crypto from 'crypto'

export function isNil(x:any):boolean {
  return x === null || x === undefined;
}

/**
 *  Hash a list of strings in a consistent way.
 */
export function hashStrings(strings:string[]):string {
  let ret = crypto.createHash('sha256');
  strings.forEach(s => {
    let hash = crypto.createHash('sha256');
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