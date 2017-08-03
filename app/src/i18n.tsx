import * as log from 'electron-log'

export interface IMessages {
  labels: {
    TrialVersion: string,
    Rain: string,
  },
  nav: {
    Accounts: string,
    Transactions: string,
    Buckets: string,
    Kicked: string,
    Connections: string,
    Import: string,
  },
  menu: {
    file: {
      label: string,
      NewBudget: string,
      OpenBudget: string,
      OpenRecent: string,
      DuplicateWindow: string,
      ImportTransactions: string,
    },
    register: {
      PurchaseFullVersion: string,
      EnterLicense: string,
    },
    help: {
      LearnMore: string,
      ShowLogFiles: string,
      ReportBug: string,
      Chat: string,
    },
  }
}

interface ILangPack {
  name: string;
  messages: IMessages;
}

class TranslationContext {
  private _locale:string = 'en';

  constructor(private packs:{[k:string]:ILangPack}) {
  }

  get locale() {
    return this._locale
  }
  setLocale(x:string) {
    if (this.packs[x] !== undefined) {
      this._locale = x;  
    } else {
      log.warn(`Not setting lang to unknown: ${x}`)
    }

  }
  languages() {
    return Object.keys(this.packs).map(key => {
      return {
        locale: key,
        name: this.packs[key].name,
      };
    })
  }
  get _():IMessages {
    return this.packs[this._locale].messages;
  }
}

const messages:{[k:string]:ILangPack} = {
  en: {
    name: 'English',
    messages: {
      labels: {
        TrialVersion: 'Trial Version',
        Rain: 'Rain',
      },
      nav: {
        Accounts: 'Accounts',
        Transactions: 'Transactions',
        Buckets: 'Buckets',
        Kicked: 'Kicked',
        Connections: 'Connections',
        Import: 'Import',
      },
      menu: {
        file: {
          label: 'File',
          NewBudget: 'New Budget...',
          OpenBudget: 'Open Budget...',
          OpenRecent: 'Open Recent',
          DuplicateWindow: 'Duplicate Window',
          ImportTransactions: 'Import Transactions...',
        },
        register: {
          PurchaseFullVersion: 'Purchase Full Version...',
          EnterLicense: 'Enter License...',
        },
        help: {
          LearnMore: 'Learn More',
          ShowLogFiles: 'Show Log Files...',
          ReportBug: 'Report Bug...',
          Chat: 'Chat...',
        }
      }
    }
  },
  es: {
    name: 'Español',
    messages: {
      labels: {
        TrialVersion: 'Versión de Prueba',
        Rain: 'Lluvia'
      },
      nav: {
        Accounts: 'Cuentas',
        Transactions: 'Transacciones',
        Buckets: 'Cubos',
        Kicked: 'Echados',
        Connections: 'Conexiones',
        Import: 'Importar',
      },
      menu: {
        file: {
          label: 'Archivo',
          NewBudget: 'Presupuesto nuevo...',
          OpenBudget: 'Abrir presupuesto...',
          OpenRecent: 'Abrir lo recientemente',
          DuplicateWindow: 'Duplicar la ventana',
          ImportTransactions: 'Importar transacciones...',
        },
        register: {
          PurchaseFullVersion: 'Comprar las versión completa...',
          EnterLicense: 'Entrar licencia...',
        },
        help: {
          LearnMore: 'Aprende más',
          ShowLogFiles: 'Mostrar archivos de registro',
          ReportBug: 'Reportar un error',
          Chat: 'Charlar...',
        }
      }
    }
  },
}

export const tx = new TranslationContext(messages);

if (process.env.LANG) {
  tx.setLocale(process.env.LANG);
}
