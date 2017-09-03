import * as log from 'electron-log'
import { remote } from 'electron'

import { IMessages, ILangPack } from './langs/spec'

import {pack as en} from './langs/en';
import {pack as es} from './langs/es';

const packs:{[x:string]:ILangPack} = {en, es};

class TranslationContext {
  private langpack:ILangPack = en;
  private _locale:string = 'en';
  constructor() {
  }
  get locale() {
    return this._locale
  }
  setLocale(x:string) {
    if (packs[x]) {
      this.langpack = packs[x];
      this._locale = x;
      log.info(`locale set to: ${x}`);
    } else {
      log.warn(`Not setting locale to unknown: ${x}`);
      this.langpack = en;
      this._locale = 'en';
    }
  }
  get _():IMessages {
    return this.langpack.messages;
  }
  sss<T>(key:keyof IMessages, dft:T):T {
    let parts = key.split('.');
    let result:any = tx._;
    try {
      parts.forEach(part => {
        result = result[part];
        if (result === undefined) {
          throw new Error(`Unable to find translation for '${key}'`);
        }
      })
    } catch(err) {
      log.warn('Localization warning:', err);
      result = dft;
    }
    return result;
  }
  toString() {
    return `TranslationContext locale=${this._locale}`;
  }
  localizeThisPage() {
    Array.from(document.querySelectorAll('[data-transid]'))
    .forEach((elem:HTMLElement) => {
      try {
        let trans_id = elem.getAttribute('data-transid');
        let dft = elem.innerText;
        elem.innerText = this.sss(trans_id, dft);
      } catch(err) {
        console.warn('Localization error:', err, elem);
      }
    })
  }
}

const env = remote ? remote.process.env : process.env;
export const tx = new TranslationContext();
if (env.LANG) {
  tx.setLocale(env.LANG);
}
