import { shell, app, Menu } from 'electron'
import * as log from 'electron-log'
import {openDialog, newBudgetFileDialog, newBudgetWindow} from './files'
import {startFindInPage, findNext, findPrev} from './finding'
import { isRegistered, openBuyPage, promptForLicense } from './drm'

let FileMenu = {
  label: 'File',
  submenu: [
    {
      label: 'New Window',
      accelerator: 'CmdOrCtrl+N',
      click() {
        newBudgetWindow();
      }
    },
    {
      label: 'New Budget...',
      accelerator: 'CmdOrCtrl+Shift+N',
      click() {
        newBudgetFileDialog();
      }
    },
    {
      label: 'Open Budget...',
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
    {role: 'selectall'},
    {type: 'separator'},
    {
      label: 'Find...',
      accelerator: 'CmdOrCtrl+F',
      click() {
        startFindInPage();
      }
    },
    {
      label: 'Find Next',
      accelerator: 'CmdOrCtrl+G',
      click() {
        findNext();
      }
    },
    {
      label: 'Find Previous',
      accelerator: 'CmdOrCtrl+Shift+G',
      click() {
        findPrev();
      }
    }
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
      click () { shell.openExternal('https://www.bucketsisbetter.com') }
    },
    {
      label: 'Show Log Files...',
      click() {
        shell.showItemInFolder(log.transports.file.file);
      }
    },
    {
      label: 'Report Bug...',
      click() {
        shell.openExternal('mailto:hello@bucketsisbetter.com?subject=Bug%20Report');
      }
    }
  ],
};

let RegisterMenu = {
    label: 'Trial Version',
    submenu: [
      {
        label: 'Purchase Full Version...',
        click() {
          openBuyPage();
        },
      },
      {
        label: 'Enter License...',
        click() {
          promptForLicense();
        },
      }
    ]
  }

let template:any[] = [
  FileMenu,
  EditMenu,
  ViewMenu,
  WindowMenu, 
  HelpMenu,
];

let preMenus = [];

if (process.platform === 'darwin') {
  // Buckets Menu
  preMenus.push({
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

export function adjustTrialMenu() {
  template = [
    ...preMenus,
    FileMenu,
    EditMenu,
    ViewMenu,
    WindowMenu,
  ]
  if (!isRegistered()) {
    template.push(RegisterMenu);
  }
  template.push(HelpMenu);
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

export const menu = Menu.buildFromTemplate(template)
