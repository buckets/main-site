import { shell, app, Menu, BrowserWindow } from 'electron'
import * as log from 'electron-log'
import * as Path from 'path'
import { openBudgetFileDialog,
         newBudgetFileDialog,
         duplicateWindow,
         BudgetFile} from './files'
import {startFindInPage, findNext, findPrev} from './finding'
import { isRegistered, openBuyPage, promptForLicense } from './drm'
import { getRecentFiles, PersistEvents } from './persistent'
import { sss, tx } from '../i18n'
import { reportBug } from '../errors'
import { openUpdateWindow } from './updater'
import { openPreferences } from './prefs'
import { APP_ROOT } from './globals'
import { findYNAB4FileAndImport } from '../ynab'

export async function updateMenu(show_budget:boolean=false) {
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
          openBudgetFileDialog();
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

  let BudgetMenu = {
    label: sss('Budget'),
    submenu: [
      {
        label: sss('Duplicate Window'),
        id: 'only4budgets duplicate',
        accelerator: 'CmdOrCtrl+N',
        click() {
          duplicateWindow();
        },
      },
      {
        label: sss('Import Transactions...'),
        id: 'only4budgets import',
        accelerator: 'CmdOrCtrl+I',
        click() {
          let win = BrowserWindow.getFocusedWindow();
          win.webContents.send('buckets:start-file-import');
        }
      },
      {type: 'separator'},
      {
        label: sss('Import From YNAB4...'),
        id: 'only4budgets importynab',
        click() {
          let win = BrowserWindow.getFocusedWindow();
          let budgetfile = BudgetFile.fromWindowId(win.id);
          if (budgetfile) {
            findYNAB4FileAndImport(budgetfile.store);  
          }
        }
      }
    ]
  }

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
  if (show_budget) {
    template.push(BudgetMenu);
  }
  if (!isRegistered()) {
    template.push(RegisterMenu);
  }
  template.push(HelpMenu);
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (app) {
  PersistEvents.added_recent_file.on(() => {
    updateMenu();
  })
  tx.localechanged.on(() => {
    updateMenu();
  });
}
