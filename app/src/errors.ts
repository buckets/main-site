import * as os from 'os'
import * as querystring from 'querystring'
import * as Path from 'path'
import * as rp from 'request-promise'
import * as log from 'electron-log'
import * as moment from 'moment'
import * as _ from 'lodash'
import { app, dialog, shell, BrowserWindow } from 'electron'
import { sss, tx } from './i18n'
import { APP_ROOT } from './mainprocess/globals'
import { onlyRunInMain } from './rpc'
import { isRegistered } from './mainprocess/drm'

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
    height: 400,
  })
  
  let qs = {
    template: args.template || '',
    nittygritty: nittyGritty(args.err),
    logfile_path: log.transports.file.file,
  }
  win.loadURL(`file://${Path.join(APP_ROOT, 'src/wwwroot/misc/reportbug.html')}?${querystring.stringify(qs)}`)
}

export async function submitBugReport(body:{
  from_email: string;
  body: string;
  attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
  }>
}) {
  log.silly('submitting bug report')
  try {
    await rp({
      method: 'POST',
      uri: SUBMIT_URL,
      body: Object.assign({
        bugid: generateBugID(),
      }, body),
      json: true,
    })
  } catch(err) {
    reportErrorToUser('Error submitting report :(  Would you mind sending an email to bugs@budgetwithbuckets.com instead?', {err: err})
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
  if (last_focused_window && last_focused_window.webContents) {
    loc = last_focused_window.webContents.getURL();  
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
      sss('action.ignore', 'Ignore'),
      sss('action.chat', 'Chat'),
      sss('action.report bug', 'Report Bug'),
    ],
    defaultId: 0,
  }, (indexClicked) => {
    if (indexClicked === 0) {
      // Ignore
    } else if (indexClicked === 1) {
      // Get Help
      shell.openExternal('https://www.budgetwithbuckets.com/chat');
    } else if (indexClicked === 2) {
      // Report Bug
      openBugReporter({err: args.err});
    }
  })
});

export function displayError(text?:string, title?:string) {
  dialog.showMessageBox({
    title: title || sss('Error'),
    message: text,
    buttons: [
      sss('OK'),
    ],
    defaultId: 0,
  }, () => {
    
  })
}