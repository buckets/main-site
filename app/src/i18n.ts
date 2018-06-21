import * as Path from 'path'
import { remote, app } from 'electron'
import { PSTATE } from './mainprocess/persistent'
import { APP_ROOT } from './mainprocess/globals'
import { CONTEXT } from '@iffycan/i18n'
export { sss } from '@iffycan/i18n'

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

CONTEXT.configure({
  langpack_basepath: Path.join(APP_ROOT, 'src/langs'),
})

export const tx = CONTEXT;

export async function startLocalizing():Promise<string> {
  let locale = await getLocale();
  await tx.setLocale(locale);
  return tx.locale;
}

export async function localizeThisPage() {
  let locale = await getLocale();
  await tx.localizeThisHTMLPage(locale);
}


