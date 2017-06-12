import {app, Menu} from 'electron';
import {openDialog, newBudgetFileDialog} from './files';

let FileMenu = {
  label: 'File',
  submenu: [
    {
      label: 'New Budget',
      accelerator: 'CmdOrCtrl+Shift+N',
      click() {
        newBudgetFileDialog();
      }
    },
    {
      label: 'Open...',
      accelerator: 'CmdOrCtrl+O',
      click() {
        openDialog();
      }
    }
  ],
};
let EditMenu = {
  label: 'Edit',
  submenu: [
    {role: 'undo'},
    {role: 'redo'},
    {type: 'separator'},
    {role: 'cut'},
    {role: 'copy'},
    {role: 'paste'},
    {role: 'pasteandmatchstyle'},
    {role: 'delete'},
    {role: 'selectall'}
  ]
};
let ViewMenu = {
  label: 'View',
  submenu: [
    {role: 'reload'},
    {role: 'forcereload'},
    {role: 'toggledevtools'},
    {type: 'separator'},
    {role: 'resetzoom'},
    {role: 'zoomin'},
    {role: 'zoomout'},
    {type: 'separator'},
    {role: 'togglefullscreen'}
  ]
};
let WindowMenu = {
  role: 'window',
  submenu: [
    {role: 'minimize'},
    {role: 'close'}
  ]
};
let HelpMenu = {
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click () { require('electron').shell.openExternal('https://www.bucketsisbetter.com') }
    }
  ]
};

let template:any[] = [
  FileMenu,
  EditMenu,
  ViewMenu,
  WindowMenu,
  HelpMenu,
]

if (process.platform === 'darwin') {
  // Buckets Menu
  template.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  })
  EditMenu.submenu.push(
    {type: 'separator'},
    <any>{
      label: 'Speech',
      submenu: [
        {role: 'startspeaking'},
        {role: 'stopspeaking'}
      ]
    }
  )
  WindowMenu.submenu = <any>[
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}

export const menu = Menu.buildFromTemplate(template)
