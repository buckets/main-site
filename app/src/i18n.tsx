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
  toString() {
    return `TranslationContext locale=${this._locale}`;
  }
}

console.log('remote', remote);
const env = remote ? remote.process.env : process.env;

export const tx = new TranslationContext();
if (env.LANG) {
  tx.setLocale(env.LANG);
}
