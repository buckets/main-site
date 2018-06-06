import { remote, app } from 'electron'
import { PSTATE } from './mainprocess/persistent'
import { TranslationContext } from '@iffycan/i18n'
import { IMessages } from './langs/spec'

async function getLocale():Promise<string> {
  // BUCKETS_LANG environment variable beats all
  const env = remote ? remote.process.env : process.env;
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

export const tx = new TranslationContext<IMessages>('./langs');
export const sss = tx.sss.bind(tx);

export async function startLocalizing():Promise<string> {
  let locale = await getLocale();
  await tx.setLocale(locale);
  return tx.locale;
}

export async function localizeThisPage() {
  let locale = await getLocale();
  await tx.localizeThisHTMLPage(locale);
}


