import * as moment from 'moment-timezone'
import { PrefixLogger} from './logging'
import { EventSource } from 'buckets-core'
import { remote, app } from 'electron'
import { PSTATE } from './mainprocess/persistent'
import { setSeparators, SEPS } from 'buckets-core/dist/money'

import { IMessages, ILangPack, INumberFormat, NUMBER_FORMATS } from './langs/spec'
import {pack as en} from './langs/en';

const log = new PrefixLogger('(i18n)')

async function loadLangPack(locale:string) {
  const mod = await import(`./langs/${locale}`);
  return mod.pack as ILangPack;
}

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
  async setLocale(x:string) {
    
    // only 2-letter shortcodes are supported right now
    let totry:string[] = [
      x.substr(0, 2),
    ]
    for (const locale of totry) {
      try {
        // language
        this._langpack = await loadLangPack(locale);
        this._locale = locale;
        log.info(`locale set to: ${locale}`);

        // date
        try {
          await import(`moment/locale/${locale}`);
          moment.locale(this._locale)
          log.info('date format set');
        } catch(err) {
          if (locale !== 'en') {
            log.error('Error setting date locale', err.stack);  
          }
        }

        // numbers
        try {
          setSeparators(this.getNumberFormat());
          log.info('number format set:', JSON.stringify(SEPS));
        } catch(err) {
          log.error('Error setting number format', err.stack);
        }

        this.localechanged.emit({locale: this._locale});
        break;
      } catch(err) {
        log.error(`Error setting locale to ${locale}`)
        log.error(err.stack);
      }  
    }
  }
  getNumberFormat():INumberFormat {
    return NUMBER_FORMATS[this.langpack.numbers]
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
  /**
   *  Call this to start localization for renderer HTML/JS pages
   */
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
  // BUCKETS_LANG environment variable beats all
  if (env.BUCKETS_LANG) {
    return env.BUCKETS_LANG;
  } else {
    // Application preference
    if (PSTATE.locale) {
      return PSTATE.locale;
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
    await tx.setLocale(locale);
    return tx.locale;
  }
}

const env = remote ? remote.process.env : process.env;
export const tx = new TranslationContext();
export const localizeThisPage = tx.localizeThisPage.bind(tx);
export const sss = tx.sss.bind(tx);

