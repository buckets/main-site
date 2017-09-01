import * as log from 'electron-log'

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
}

export const tx = new TranslationContext();
console.log('process.env', process.env);
console.log('packs', packs);
if (process.env.LANG) {
  tx.setLocale(process.env.LANG);
}
