import { shell, app, Menu, BrowserWindow } from 'electron'
import * as log from 'electron-log'
import { openBudgetFileDialog,
         newBudgetFileDialog,
         duplicateWindow,
         BudgetFile} from './files'
import {startFindInPage, findNext, findPrev} from './finding'
import { isRegistered, openBuyPage, promptForLicense } from './drm'
import { getRecentFiles, PersistEvents } from './persistent'
import { sss, tx } from '../i18n'
import { openBugReporter } from '../errors'
import { openUpdateWindow } from './updater'
import { openPreferences } from './prefs'
import { IS_DEBUG } from './globals'
import { findYNAB4FileAndImport } from '../ynab'
import { openDocs } from '../docs'

export async function updateMenu(args:{
    budget?:BudgetFile,
  }={}) {
  const { budget } = args;
  let recent_files = await getRecentFiles();
  let FileMenu:any = {
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
  let undo_label = sss('Undo');
  let undo_enabled = true;
  let redo_label = sss('Redo');
  let redo_enabled = true;
  if (budget) {
    const nextUndoLabel = budget.store.undo.nextUndoLabel;
    const nextRedoLabel = budget.store.undo.nextRedoLabel;
    if (nextUndoLabel) {
      undo_label = [undo_label, nextUndoLabel].join(' ');
    } else {
      undo_enabled = false;
    }
    if (nextRedoLabel) {
      redo_label = [redo_label, nextRedoLabel].join(' ');
    } else {
      redo_enabled = false;
    }
  }
  let EditMenu = {
    label: sss('Edit'),
    submenu: [
      {
        label: undo_label,
        enabled: undo_enabled,
        accelerator: 'CmdOrCtrl+Z',
        click() {
          let win = BrowserWindow.getFocusedWindow();
          let budgetfile = BudgetFile.fromWindowId(win.id);
          if (budgetfile) {
            budgetfile.doUndo();
          } else {
            // do the default action
            win.webContents.undo();
          }
        }
      },
      {
        label: redo_label,
        enabled: redo_enabled,
        accelerator: 'CmdOrCtrl+Y',
        click() {
          let win = BrowserWindow.getFocusedWindow();
          let budgetfile = BudgetFile.fromWindowId(win.id);
          if (budgetfile) {
            budgetfile.doRedo();
          } else {
            // do the default action
            win.webContents.redo();
          }
        }
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
          BudgetFile.fromWindowId(win.id).openImportFileDialog();
          win.webContents.send('buckets:goto', '/import');
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
            findYNAB4FileAndImport(budgetfile, budgetfile.store);
            win.webContents.send('buckets:goto', '/tools/ynabimport');
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
        click () { shell.openExternal('https://www.budgetwithbuckets.com') }
      },
      {
        label: sss('Getting Started...'),
        click() {
          shell.openExternal('https://www.budgetwithbuckets.com/gettingstarted');
          // openDocs('getting-started');
        }
      },
      {
        label: sss('Buckets Guide'),
        click() {
          openDocs();
        }
      },
      {type: 'separator'},
      {
        label: sss('Chat...'),
        click() {
          shell.openExternal('https://www.budgetwithbuckets.com/chat');
        }
      },
      {
        label: sss('Show Log Files...'),
        click() {
          shell.showItemInFolder(log.transports.file.file);
        }
      },
      {
        label: sss('Report Bug...'),
        click() {
          openBugReporter();
        }
      },
      {
        label: sss('Report Translation Error...'),
        click() {
          openBugReporter({
            template: sss('It says:') + '\n' + sss('It should say:'),
          });
        }
      },
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

  const about = {
    label: sss('About Buckets'),
    click() {
      openUpdateWindow();
    }
  }
  const check_for_updates = {
    label: sss('Check For Updates...'),
    click() {
      openUpdateWindow();
    },
  }
  const preferences = {
    label: sss('Preferences...'),
    accelerator: 'CmdOrCtrl+,',
    click() {
      openPreferences();
    }
  }
  const quit = {
    role: 'quit',
    label: sss('Quit Buckets'),
    accelerator: 'CmdOrCtrl+q',
  }

  if (process.platform === 'darwin') {
    // Buckets Menu
    preMenus.push({
      label: app.getName(),
      submenu: [
        about,
        check_for_updates,
        {type: 'separator'},
        preferences,
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
        quit,
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
  } else {
    // windows/linux
    FileMenu.submenu.push({type: 'separator'})
    FileMenu.submenu.push(quit);
    HelpMenu.submenu.unshift(about as any, check_for_updates, {type: 'separator'})
    EditMenu.submenu.push({type: 'separator'})
    EditMenu.submenu.push(preferences)
  }
  template = [
    ...preMenus,
    FileMenu,
    EditMenu,
    ViewMenu,
    WindowMenu,
  ]
  if (budget) {
    template.push(BudgetMenu);
  }
  if (!isRegistered()) {
    template.push(RegisterMenu);
  }
  if (IS_DEBUG) {
    template.push({
      label: 'DEBUG',
      submenu: [
        {
          label: 'Throw an error',
          click() {
            throw new Error('This is an intentionally caused error');
          }
        },
      ],
    })
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
