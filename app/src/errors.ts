import { dialog, shell } from 'electron';

export function reportBug(body?:string) {
  let url = 'mailto:hello@bucketsisbetter.com?subject=Bug%20Report';
  if (body) {
    url = `${url}&body=${encodeURIComponent(body)}`;
  }
  shell.openExternal(url);
}

export function reportErrorToUser(text?:string, args?:{
  title?:string,
  err?:Error,
}) {
  args = args || {};
  dialog.showMessageBox({
    title: args.title || 'Error',
    message: text || `There has been an error.`,
    detail: "If this error keeps happening or doesn't make sense, please report a bug or chat with us.",
    buttons: [
      'Ignore',
      'Chat',
      'Report Bug',
    ],
    defaultId: 0,
  }, (indexClicked) => {
    if (indexClicked === 0) {
      // Ignore
    } else if (indexClicked === 1) {
      // Get Help
      shell.openExternal('https://www.bucketsisbetter.com/chat');
    } else if (indexClicked === 2) {
      // Report Bug
      if (args.err) {
        reportBug(`\n\n--- Include anything else you want to add above this line ---\n${args.err.stack}`);
      } else {
        reportBug();  
      }
    }
  })
}

export function displayError(text?:string, title?:string) {
  dialog.showMessageBox({
    title: title || 'Error',
    message: text,
    buttons: [
      'OK',
    ],
    defaultId: 0,
  }, () => {
    
  })
}