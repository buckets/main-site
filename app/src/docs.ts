import { BrowserWindow } from 'electron'


export function openDocs(path:string='index.html') {
  let win = new BrowserWindow({
    width: 1000,
    height: 800,
    show: true,
    title: `Guide`,
  });
  path = `buckets://docs/${path}`
  win.loadURL(path)
}
