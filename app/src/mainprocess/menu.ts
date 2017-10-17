import { shell, app, Menu, BrowserWindow } from 'electron'
import * as log from 'electron-log'
import * as Path from 'path'
import {openDialog, newBudgetFileDialog, newBudgetWindow, BudgetFile} from './files'
import {startFindInPage, findNext, findPrev} from './finding'
import { isRegistered, openBuyPage, promptForLicense } from './drm'
import { getRecentFiles, PersistEvents } from './persistent'
import { sss, tx } from '../i18n'
import { reportBug } from '../errors'
import { openUpdateWindow } from './updater'
import { openPreferences } from './prefs'
import { APP_ROOT } from './globals'

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
    label: sss('Edit'),
    submenu: [
      {
        role: 'undo',
        label: sss('Undo'),
      },
      {
        role: 'redo',
        label: sss('Redo'),
      },
      {type: 'separator'},
      {
        role: 'cut',
        label: sss('Cut'),
      },
      {
        role: 'copy',
        label: sss('Copy'),
      },
      {
        role: 'paste',
        label: sss('Paste'),
      },
      {
        role: 'pasteandmatchstyle',
        label: sss('Paste and Match Style'),
      },
      {
        role: 'delete',
        label: sss('Delete'),
      },
      {
        role: 'selectall',
        label: sss('Select All'),
      },
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
      {
        role: 'reload',
        label: sss('Reload'),
      },
      {
        role: 'forcereload',
        label: sss('Force Reload'),
      },
      {
        role: 'toggledevtools',
        label: sss('Toggle Developer Tools'),
      },
      {type: 'separator'},
      {
        role: 'resetzoom',
        label: sss('Actual Size'),
      },
      {
        role: 'zoomin',
        label: sss('Zoom In'),
      },
      {
        role: 'zoomout',
        label: sss('Zoom Out'),
      },
      {type: 'separator'},
      {
        role: 'togglefullscreen',
        label: sss('Toggle Full Screen'),
      },
    ]
  };
  let WindowMenu = {
    role: 'window',
    label: sss('Window'),
    submenu: [
      {
        role: 'minimize',
        label: sss('Minimize'),
      },
      {
        role: 'close',
        label: sss('Close Window'),
      }
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
      },
      {type: 'separator'},
      {
        label: sss('API/File Format'),
        click() {
          let win = new BrowserWindow({
            width: 600,
            height: 400,
          })
          let path = Path.join(APP_ROOT, 'src/wwwroot/misc/fileformat.html');
          path = `file://${path}`;
          win.loadURL(path);
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
        {
          role: 'about',
          label: sss('About Buckets'),
        },
        {
          label: sss('Check For Updates...'),
          click() {
            openUpdateWindow();
          },
        },
        {type: 'separator'},
        {
          label: sss('Preferences...'),
          accelerator: 'CmdOrCtrl+,',
          click() {
            openPreferences();
          }
        },
        {type: 'separator'},
        {
          role: 'services', submenu: [],
          label: sss('Services'),
        },
        {type: 'separator'},
        {
          role: 'hide',
          label: sss('Hide Buckets'),
        },
        {
          role: 'hideothers',
          label: sss('Hide Others'),
        },
        {
          role: 'unhide',
          label: sss('Show All'),
        },
        {type: 'separator'},
        {
          role: 'quit',
          label: sss('Quit Buckets'),
        }
      ]
    })
    EditMenu.submenu.push(
      {type: 'separator'},
      <any>{
        label: sss('Speech'),
        submenu: [
          {
            role: 'startspeaking',
            label: sss('Start Speaking'),
          },
          {
            role: 'stopspeaking',
            label: sss('Stop Speaking'),
          }
        ]
      }
    )
    WindowMenu.submenu = <any>[
      {
        role: 'close',
        label: sss('Close Window'),
      },
      {
        role: 'minimize',
        label: sss('Minimize'),
      },
      {
        role: 'zoom',
        label: sss('Zoom'),
      },
      {type: 'separator'},
      {
        role: 'front',
        label: sss('Bring All to Front'),
      }
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

if (app) {
  PersistEvents.on('added-recent-file', () => {
    updateMenu();
  })
  tx.on('locale-set', () => {
    updateMenu();
  });
}
