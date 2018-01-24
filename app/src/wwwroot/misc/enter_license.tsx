import { sss, localizeThisPage } from '../../i18n'
import { remote } from 'electron'
import { PrefixLogger } from '../../logging'
import { enterLicense, openBuyPage } from '../../mainprocess/drm';

const log = new PrefixLogger('(enter_license)')
const { app } = remote;

let state = 'init';
let textarea_box = document.getElementById('license-input');
let button = document.getElementById('submit-button');
let status_div = document.getElementById('status');
let clicktobuy = document.getElementById('clicktobuy');

localizeThisPage();

clicktobuy.addEventListener('click', (ev) => {
  openBuyPage();
  ev.preventDefault();
  return false;
}, false)
button.addEventListener('click', () => {
  if (state === 'init') {
    status_div.innerHTML = '&nbsp;';
    status_div.classList.remove('error');
    try {
      enterLicense((textarea_box as any).value);
      state = 'success';
      status_div.innerHTML = sss('Success!');
      button.innerHTML = sss('Restart Buckets');
    } catch(err) {
      log.error(`Error entering license: ${err}`);
      status_div.innerHTML = sss('Invalid license');
      status_div.classList.add('error');
    }
  } else if (state === 'success') {
    log.info('Entered license');
    app.relaunch();
    app.quit();
  }
}, false);