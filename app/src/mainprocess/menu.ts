import { shell, app, Menu, BrowserWindow } from 'electron'
import * as log from 'electron-log'
import {openDialog, newBudgetFileDialog, newBudgetWindow, BudgetFile} from './files'
import {startFindInPage, findNext, findPrev} from './finding'
import { isRegistered, openBuyPage, promptForLicense } from './drm'
import { getRecentFiles } from './persistent'
import { sss, tx } from '../i18n'
import { reportBug } from '../errors'
import { openUpdateWindow } from './updater'

function recursiveMap(menuitems:Electron.MenuItem[], func) {
  menuitems.forEach(item => {
    func(item);
    if ((item as any).submenu !== undefined && (item as any).submenu) {
      recursiveMap((item as any).submenu.items as Electron.MenuItem[], func);
    }
  })
}

export async function updateEnabled(isbudget:boolean) {
  recursiveMap(Menu.getApplicationMenu().items, item => {
    if (item.id) {
      let labels = item.id.split(' ');
      if (labels.indexOf('only4budgets') !== -1) {
        item.enabled = isbudget;  
      }
    }
  })
}

export async function updateMenu() {
  let recent_files = await getRecentFiles();
  let FileMenu = {
    label: sss('File'),
    submenu: [
      {
        label: sss('New Budget...'),
        accelerator: 'CmdOrCtrl+Shift+N',
        click() {
          newBudgetFileDialog();
        }
      },
      {
        label: sss('Open Budget...'),
        accelerator: 'CmdOrCtrl+O',
        click() {
          openDialog();
        }
      },
      {
        label: sss('Open Recent...'),
        enabled: recent_files.length !== 0,
        submenu: recent_files.map(path => {
          return {
            label: path,
            click() {
              BudgetFile.openFile(path);
            }
          }
        })
      },
      {type: 'separator'},
      {
        label: sss('Duplicate Window'),
        id: 'only4budgets duplicate',
        accelerator: 'CmdOrCtrl+N',
        click() {
          newBudgetWindow();
        },
      },
      {type: 'separator'},
      {
        label: sss('Import Transactions...'),
        id: 'only4budgets import',
        accelerator: 'CmdOrCtrl+I',
        click() {
          let win = BrowserWindow.getFocusedWindow();
          win.webContents.send('start-file-import');
        }
      },
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
        label: sss('Find...'),
        accelerator: 'CmdOrCtrl+F',
        click() {
          startFindInPage();
        }
      },
      {
        label: sss('Find Next'),
        accelerator: 'CmdOrCtrl+G',
        click() {
          findNext();
        }
      },
      {
        label: sss('Find Previous'),
        accelerator: 'CmdOrCtrl+Shift+G',
        click() {
          findPrev();
        }
      }
    ]
  };
  let ViewMenu = {
    label: sss('View'),
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
    label: sss('Window'),
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  };

  let HelpMenu = {
    role: 'help',
    label: sss('Help'),
    submenu: [
      {
        label: sss('Learn More'),
        click () { shell.openExternal('https://www.bucketsisbetter.com') }
      },
      {
        label: sss('Getting Started...'),
        click() {
          shell.openExternal('https://www.bucketsisbetter.com/gettingstarted');
        }
      },
      {
        label: sss('Chat...'),
        click() {
          shell.openExternal('https://www.bucketsisbetter.com/chat');
        }
      },
      {type: 'separator'},
      {
        label: sss('Show Log Files...'),
        click() {
          shell.showItemInFolder(log.transports.file.file);
        }
      },
      {
        label: sss('Report Bug...'),
        click() {
          reportBug();
        }
      },
      {
        label: sss('Report Translation Error...'),
        click() {
          let langname = tx.langpack.name;
          reportBug(`Language: ${langname}\n` + sss('It says:') + '\n' + sss('It should say:'));
        }
      }
    ],
  };

  let RegisterMenu = {
      label: sss('Trial Version'),
      submenu: [
        {
          label: sss('Purchase Full Version...'),
          click() {
            openBuyPage();
          },
        },
        {
          label: sss('Enter License...'),
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
        {
          label: sss('Check For Updates...'),
          click() {
            openUpdateWindow();
          },
        },
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
        label: sss('Speech'),
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

tx.on('locale-set', () => {
  updateMenu();
});
