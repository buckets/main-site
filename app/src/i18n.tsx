import * as log from 'electron-log'
import { remote } from 'electron'

import { IMessages, ILangPack } from './langs/spec'

import {pack as en} from './langs/en';
import {pack as es} from './langs/es';

const packs:{[x:string]:ILangPack} = {en, es};

class TranslationContext {
  private langpack:ILangPack = en;
  private _locale:string = 'en';
  get locale() {
    return this._locale
  }
  setLocale(x:string) {
    if (packs[x]) {
      this.langpack = packs[x];
      this._locale = x;
      log.info(`locale set to: ${x}`);
    } else if (packs[x.substr(0, 2)]) {
      this._locale = x.substr(0, 2);
      this.langpack = packs[this._locale];
      log.info(`locale set to: ${this._locale}`);
    } else {
      log.warn(`Not setting locale to unknown: ${x}`);
    }
  }
  sss<T>(key:keyof IMessages, dft?:T):T {
    let entry = this.langpack.messages[key];
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
  localizeThisPage() {
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
  }
}

const env = remote ? remote.process.env : process.env;
const tx = new TranslationContext();
export const localizeThisPage = tx.localizeThisPage.bind(tx);
export const sss = tx.sss.bind(tx);
if (env.LANG) {
  tx.setLocale(env.LANG);
}
