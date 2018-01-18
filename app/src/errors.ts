import * as os from 'os'
import * as querystring from 'querystring'
import * as Path from 'path'
import { app, dialog, shell, BrowserWindow } from 'electron'
import { sss } from './i18n'
import { APP_ROOT } from './mainprocess/globals'

export function reportBug(body?:string) {
  // if (electron_is.windows()) {
  // windows mailto: doesn't work right now
  // XXX but let's just do this for everyone
  let win = new BrowserWindow({
    modal: true,
    show: true,
    width: 400,
    height: 400,
  })
  let qs = {
    body: body,
  }
  win.loadURL(`file://${Path.join(APP_ROOT, 'src/wwwroot/misc/reportbug.html')}?${querystring.stringify(qs)}`)
  // } else {
  //   let url = 'mailto:hello@budgetwithbuckets.com?subject=Bug%20Report';
  //   if (body) {
  //     url = `${url}&body=${encodeURIComponent(body)}`;
  //   }
  //   shell.openExternal(url);  
  // }
}

export function errorBody(err?:Error) {
  return '\n\n---' + sss('bug-include-line', 'Write details above this line') + `---
app: ${app.getVersion()} (node: ${process.version})
os: ${process.platform} ${os.release()} ${process.arch}
${err ? err.stack : ''}`;
}

export function reportErrorToUser(text?:string, args?:{
  title?:string,
  err?:Error,
}) {
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
      if (args.err) {
        let body = errorBody(args.err);
        reportBug(body);
      } else {
        reportBug();  
      }
    }
  })
}

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