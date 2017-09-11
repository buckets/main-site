import * as log from 'electron-log'
import * as moment from 'moment'
import { EventEmitter } from 'events'
import { remote, app } from 'electron'

import { IMessages, ILangPack } from './langs/spec'

import {pack as en} from './langs/en';
import {pack as es} from './langs/es';
import {pack as he} from './langs/he';

const packs:{[x:string]:ILangPack} = {en, es, he};

class TranslationContext extends EventEmitter {
  private _langpack:ILangPack = en;
  private _locale:string = 'en';
  get locale() {
    return this._locale
  }
  get langpack() {
    return this._langpack;
  }
  setLocale(x:string) {
    let was_set = true;
    if (packs[x]) {
      this._langpack = packs[x];
      this._locale = x;
      log.info(`locale set to: ${x}`);
    } else if (packs[x.substr(0, 2)]) {
      this._locale = x.substr(0, 2);
      this._langpack = packs[this._locale];
      log.info(`locale set to: ${this._locale}`);
    } else {
      log.warn(`Not setting locale to unknown: ${x}`);
      was_set = false;
    }
    if (was_set) {
      try {
        moment.locale(this._locale)
      } catch(err) {
        console.error('Error setting date locale', err.stack);
      }
      this.emit('locale-set', {locale: this._locale});
    }
  }
  sss<T>(key:keyof IMessages, dft?:T):T {
    let entry = this._langpack.messages[key];
    if (dft === undefined && typeof key === 'string') {
      // The key is the string to translate.
      return (entry ? entry.val : key) as any;
    } else {
      return (entry ? entry.val : dft) as any;
    }
  }
  toString() {
    return `TranslationContext locale=${this._locale}`;
  }
  localizeThisPage(_skipwatch?:boolean) {
    document.documentElement.setAttribute('dir', this.langpack.dir);
    Array.from(document.querySelectorAll('[data-translate]'))
    .forEach((elem:HTMLElement) => {
      try {
        let trans_id = elem.getAttribute('data-translate');
        let dft = elem.innerText;
        if (!trans_id) {
          trans_id = dft;
        }
        elem.innerHTML = this.sss(trans_id as any, dft);
      } catch(err) {
        console.warn('Localization error:', err, elem);
      }
    })
    if (!_skipwatch) {
      this.on('locale-set', () => {
        this.localizeThisPage(true);
      })
    }
  }
}

function getLocale():Promise<string> {
  if (env.LANG) {
    return Promise.resolve(env.LANG);
  } else {
    let realapp = app || remote.app;
    if (realapp.isReady()) {
      return Promise.resolve(realapp.getLocale());
    } else {
      return new Promise((resolve, reject) => {
        realapp.on('ready', () => {
          resolve(app.getLocale() || 'en');
        })
      })
    }
  }  
}

const env = remote ? remote.process.env : process.env;
export const tx = new TranslationContext();
export const localizeThisPage = tx.localizeThisPage.bind(tx);
export const sss = tx.sss.bind(tx);

getLocale().then(locale => {
  tx.setLocale(locale);  
})
