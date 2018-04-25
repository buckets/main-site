import * as os from 'os'
import * as util from 'util'
import * as querystring from 'querystring'
import * as Path from 'path'
import * as rp from 'request-promise'
import * as moment from 'moment'
import * as electron_log from 'electron-log'
import * as _ from 'lodash'
import { app, remote, dialog, BrowserWindow } from 'electron'
import { sss, tx } from './i18n'
import { APP_ROOT } from './mainprocess/globals'
import { onlyRunInMain } from './rpc'
import { isRegistered } from './mainprocess/drm'
import { PrefixLogger } from './logging'

const log = new PrefixLogger('(errors)');

const SUBMIT_URL = process.env.BUCKETS_BUGREPORT_URL || 'https://www.budgetwithbuckets.com/_api/bugreport';

let last_focused_window:BrowserWindow;
if (app) {
  app.on('browser-window-focus', (ev, win) => {
    last_focused_window = win;
  })
}

export function openBugReporter(args:{
  template?:string,
  err?:Error,
} = {}) {
  // if (electron_is.windows()) {
  // windows mailto: doesn't work right now
  // XXX but let's just do this for everyone
  let win = new BrowserWindow({
    modal: true,
    show: true,
    width: 500,
    height: 490,
  })
  
  let qs = {
    template: args.template || '',
    nittygritty: nittyGritty(args.err),
    logfile_path: electron_log.transports.file.file,
  }
  win.loadURL(`file://${Path.join(APP_ROOT, 'src/wwwroot/misc/reportbug.html')}?${querystring.stringify(qs)}`)
}

export async function submitFeedback(body:{
  from_email: string;
  body: string;
  attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
  }>
}, options:{
  throwerr?: boolean;
} = {}) {
  log.info('Submitting feedback to', SUBMIT_URL)
  try {
    let r = await rp({
      method: 'POST',
      uri: SUBMIT_URL,
      body: Object.assign({
        bugid: generateBugID(),
      }, body),
      json: true,
    })
    log.info('Feedback submitted', r);
  } catch (err) {
    log.error('Error submitting feedback');
    log.error(err);
    reportErrorToUser('Error submitting report :(  Would you mind sending an email to bugs@budgetwithbuckets.com instead?', {err: err})
    if (options.throwerr) {
      throw err;  
    }
  }
}

export function choose<T>(fromlist:Array<T>):T {
  return fromlist[Math.floor(Math.random() * fromlist.length)];
}

export function generateBugID():string {
  let parts = [];
  if (isRegistered()) {
    parts.push(choose(['Y', 'y']))
  } else {
    parts.push(choose(['N', 'n']))
  }
  for (let i = 0; i < 7; i++) {
    parts.push(choose('bcdfghjkmpqstvwxz23456789BCDFGHJKLMPQSTVWXZ'.split('')))
  }
  return `${moment.utc().format('YYYYMMDD')}-${_.shuffle(parts).join('')}`;
}

export function nittyGritty(err?:Error) {
  let loc;
  try {
    if (last_focused_window && !last_focused_window.isDestroyed() && last_focused_window.webContents) {
      loc = last_focused_window.webContents.getURL();  
    }  
  } catch(err) {
    log.error('Error trying to get the error url', err.toString());
    log.error(err.stack);
  }
  
  return `Version: ${app.getVersion()} (node: ${process.version})
OS: ${process.platform} ${os.release()} ${process.arch}
Lang: ${tx.locale} ${tx.langpack.name} 
Loc: ${loc}
${err ? err.stack : ''}`;
}

export const reportErrorToUser = onlyRunInMain((text?:string, args?:{
  title?:string,
  err?:Error,
}) => {
  args = args || {};
  dialog.showMessageBox({
    title: args.title || sss('Error'),
    message: text || sss(`There has been an error.`),
    detail: sss('error-detail', "If this error keeps happening or doesn't make sense, please report a bug or chat with us."),
    buttons: [
      sss('action.report bug', 'Report Bug'),
      sss('action.ignore', 'Ignore'),
    ],
    defaultId: 0,
  }, (indexClicked) => {
    if (indexClicked === 0) {
      // Report Bug
      openBugReporter({err: args.err});
    }
  })
});

export function displayError(text?:string, title?:string) {
  (remote ? remote.dialog : dialog).showMessageBox({
    title: title || sss('Error'),
    message: text,
    buttons: [
      sss('OK'),
    ],
    defaultId: 0,
  }, () => {
    
  })
}

export function createErrorSubclass<T>(name:string) {
  const SubError = function(message?:string, otherprops?:T):void {
    Error.captureStackTrace(this, this.constructor);
    this.name = name;
    this.message = message;
    if (otherprops !== undefined) {
      Object.assign(this, otherprops);  
    }
  }
  util.inherits(SubError, Error);
  return SubError;
}
