import { setBaseLogger, ILogger } from '../logging'
export class QuietLogger implements ILogger {
  info(...args) {

  }
  warn(...args) {
    console.warn(...args);
  }
  error(...args) {
    console.error(...args);
  }
}
setBaseLogger(new QuietLogger());


import * as util from 'util'
import { openSqlite } from '../async-sqlite'
import { IObjectEvent, IUserInterfaceFunctions } from '../store'
import { SQLiteStore } from '../dbstore'
import { CONTEXT } from '@iffycan/i18n'
import * as tap  from 'tap'
import * as tmatch from 'tmatch'

// Configure language to be English
CONTEXT.configure({
  default_locale: 'en',
  fetcher: async (locale:string) => {
    const mod = await import(`${__dirname}/../../../app/src/langs/${locale}`);
    return mod.pack;
  }
})
CONTEXT.setLocale('en');


/**
 *  Find all objects in actual that are not matched by an object in
 *  expected.
 */
export function matchObjectArrays(expected:object[], actual:object[]) {
  let extra = [];
  let unmatched = Array.from(expected);
  for (const thing of actual) {
    let j = 0;
    let matched = false;
    for (const exp of Array.from(unmatched)) {
      if (tmatch(thing, exp)) {
        unmatched.splice(j, 1);
        matched = true;
        break;
      }
      j++;
    }
    if (!matched) {
      extra.push(thing);
    }
  }
  return {
    unmatched: unmatched,
    extra,
  }
}

export function repr(x):string {
  return util.inspect(x, {breakLength: Infinity})
}
// tap.Test.prototype.addAssert('containsObjects', 2, function(actual:object[], expected:object[], message, extra) {
//   message = message || '';
//   let { unmatched } = matchObjectArrays(expected, actual);
//   if (unmatched.length === 0) {
//     return this.pass(message);
//   } else {
//     return this.fail(`${repr(actual)} missing ${repr(unmatched)} (${message})`, extra);
//   }
// })

/**
 *  Check that a list of object contains the given object
 *  and remove that object from the list.
 */
tap.Test.prototype.addAssert('matchAndRemoveObject', 2, function(actual:object[], expected:object, message, extra) {
  for (let i = 0; i < actual.length; i++) {
    if (tmatch(actual[i], expected)) {
      // remove this object
      actual.splice(i, 1);
      return this.pass(message);
    }
  }
  message && console.log(message)
  console.log('missing', expected)
  console.log('from', actual)
  return this.fail(`${message} OBJECT ${repr(expected)} MISSING FROM ${repr(actual)})`, extra);
})

export class TestUIFunctions implements IUserInterfaceFunctions {
  attachStore(store) {

  }
  async openBankMacroBrowser():Promise<any> {
    return null;
  }
  async promptToStartYNABImport():Promise<any> {
    return null;
  }
  async getPassword():Promise<string> {
    return 'password';
  }
  http: null;
}



export async function getStore():Promise<{
  store:SQLiteStore,
  events:IObjectEvent[],
  ui:TestUIFunctions,
}> {
  const ui = new TestUIFunctions();
  const store = new SQLiteStore(openSqlite(':memory:'), ui);
  let events = [];
  await store.doSetup({
    addBucketsLicenseBucket: false,
  });
  store.events.get('obj').on(message => {
    events.push(message as IObjectEvent);
  })
  return {store, events, ui}
}
