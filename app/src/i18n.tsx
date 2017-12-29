import * as log from 'electron-log'
import * as moment from 'moment'
import { EventSource } from './events'
import { remote, app } from 'electron'
import { readState } from './mainprocess/persistent'

import { IMessages, ILangPack } from './langs/spec'

import {pack as en} from './langs/en';
import {pack as es} from './langs/es';
import {pack as he} from './langs/he';

const packs:{[x:string]:ILangPack} = {en, es, he};

class TranslationContext {
  private _langpack:ILangPack = en;
  private _locale:string = 'en';

  readonly localechanged = new EventSource<{locale:string}>();

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
      this.localechanged.emit({locale: this._locale});
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
  async localizeThisPage(args?:{
      skipwatch?:boolean,
    }):Promise<string> {
    args = args || {};
    let locale = await startLocalizing();
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
    if (!args.skipwatch) {
      this.localechanged.on(() => {
        log.info('Re-localizing page', this.locale);
        this.localizeThisPage({skipwatch:true});
      })
    }
    return locale;
  }
}

async function getLocale():Promise<string> {
  // LANG environment variable beats all
  if (env.LANG) {
    return env.LANG;
  } else {
    // Application preference
    let pstate = await readState();
    if (pstate.locale) {
      return pstate.locale;
    } else {
      // Ask the OS
      let realapp = app || remote.app;
      if (realapp.isReady()) {
        return realapp.getLocale();
      } else {
        return new Promise<string>((resolve, reject) => {
          realapp.on('ready', () => {
            resolve(app.getLocale() || 'en');
          })
        })
      }
    }
  }  
}

var STARTED_LOCALIZING = null;
export async function startLocalizing():Promise<string> {
  if (STARTED_LOCALIZING) {
    return tx.locale;
  } else {
    STARTED_LOCALIZING = true;
    let locale = await getLocale();
    tx.setLocale(locale);
    return tx.locale;
  }
}

const env = remote ? remote.process.env : process.env;
export const tx = new TranslationContext();
export const localizeThisPage = tx.localizeThisPage.bind(tx);
export const sss = tx.sss.bind(tx);

