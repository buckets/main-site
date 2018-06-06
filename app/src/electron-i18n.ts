import { remote, app } from 'electron'
import { PSTATE } from './mainprocess/persistent'
import { TranslationContext } from 'buckets-core/dist/i18n'

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