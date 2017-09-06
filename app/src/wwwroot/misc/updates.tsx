import { sss, localizeThisPage } from '../../i18n'
import { ipcRenderer } from 'electron'
import * as log from 'electron-log'

let el_current_version = document.getElementById('current-version');
let el_message = document.getElementById('message');
let el_error = document.getElementById('error');
localizeThisPage();

ipcRenderer.on('buckets:update-status', (ev, data) => {
  console.log('data', data);
  setStatus(data);
})

function setStatus(data) {
  let {current_version, error, new_version, state} = data;
  el_current_version.innerText = current_version;
  if (state === 'idle' || !state) {
    el_message.innerText = '';

    let el = document.createElement('button');
    el.innerText = sss('Check for Updates');
    el.addEventListener('click', () => {
      ipcRenderer.send('buckets:check-for-updates');
    }, false)
    el_message.appendChild(el);
  } else if (state === 'checking') {
    el_message.innerHTML = '<span class="fa fa-refresh fa-spin"></span> ' + sss('Checking for updates...');
  } else if (state === 'update-available') {
    el_message.innerText = '';
    
    let el = document.createElement('div');
    el.innerText = sss('version-available', (newv:string) => `Version ${newv} available.`)(new_version);
    el_message.appendChild(el);

    let button = document.createElement('button');
    button.innerText = sss('Download Update');
    button.addEventListener('click', () => {
      ipcRenderer.send('buckets:download-update');
    }, false);
    el_message.appendChild(button);
  } else if (state === 'not-available') {
    el_message.innerText = sss("You are running the latest version!");
  } else if (state === 'downloading') {
    el_message.innerHTML = '<span class="fa fa-refresh fa-spin"></span> ' + sss('Downloading update...');
  } else if (state === 'downloaded') {
    el_message.innerText = '';
    
    let el = document.createElement('div');
    el.innerText = sss('Update downloaded.');
    el_message.appendChild(el);

    let button = document.createElement('button');
    button.innerText = sss('Install and Relaunch Buckets');
    button.addEventListener('click', () => {
      ipcRenderer.send('buckets:install-update');
    }, false);
    el_message.appendChild(button);
  } else {
    log.error(`Unknown update state: ${state}`);
  }
  if (error) {
    el_error.innerText = sss('There was an error.  Maybe try again?');
  }
}