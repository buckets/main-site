import {remote, ipcRenderer} from 'electron'

// get THIS webcontents
remote.getCurrentWebContents()

export function listenForFinding() {
  ipcRenderer.on('find-start', () => {
    console.log('start search');
  });
  ipcRenderer.on('find-next', () => {
    console.log('find next');
  });
  ipcRenderer.on('find-prev', () => {
    console.log('find prev');
  });
}

// win.webContents.once('found-in-page', (ev, result) => {
//   console.log('found in page', ev);
//   console.log(result);
// })
// win.webContents.findInPage('credit', {

// })