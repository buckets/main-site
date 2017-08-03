import * as log from 'electron-log'

interface IMessages {
  ['New Budget...']: string;
  ['Open Budget...']: string;
  ['Open Recent']: string;
  ['Duplicate Window']: string;
  ['Import Transactions...']: string;
  ['Chat...']: string;
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
  _(x:(keyof IMessages)):string {
    return this.packs[this._locale].messages[x];
  }
}

const messages:{[k:string]:ILangPack} = {
  en: {
    name: 'English',
    messages: {
      'New Budget...': 'New Budget...',
      'Open Budget...': 'Open Budget...',
      'Open Recent': 'Open Recent',
      'Duplicate Window': 'Duplicate Window',
      'Import Transactions...': 'Import Transactions...',
      'Chat...': 'Chat...',
    }
  },
  es: {
    name: 'Español',
    messages: {
      'New Budget...': 'Presupuesto Nuevo...',
      'Open Budget...': 'Abrir Presupuesto...',
      'Open Recent': 'Abrir Lo Recientemente',
      'Duplicate Window': 'Duplicar la Ventana',
      'Import Transactions...': 'Importar Transacciones...',
      'Chat...': 'Charlar...',
    }
  },
}

export const tx = new TranslationContext(messages);
