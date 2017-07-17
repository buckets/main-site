import * as Path from 'path'
import { app, remote, shell, BrowserWindow } from 'electron'
import { APP_ROOT } from './globals'
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

let ISREGISTERED = null;
export function isRegistered():boolean {
  console.log('isRegistered()')
  if (ISREGISTERED === null) {
    console.log('it is null');
    try {
      let contents = fs.readFileSync(licenseFilePath(), {encoding:'utf8'});
      console.log('read cert');
      verifyLicense(contents);
      ISREGISTERED = true;
    } catch(err) {
      console.log('err', err);
      ISREGISTERED = false;
    }
  }
  return ISREGISTERED;
}

export function openBuyPage() {
  shell.openExternal("https://www.bucketsisbetter.com/buy");
}

const suffix = 'foo';
suffix;

let win:Electron.BrowserWindow = null;

export function promptForLicense() {
  console.log('promptForLicense');
  if (win) {
    win.focus();
    return;
  } else {
    console.log('new window');
    win = new BrowserWindow({
      width: 500,
      height: 350,
      show: false,
    });
    win.once('ready-to-show', () => {
      win.show();
    });
    win.on('close', ev => {
      win = null;
    });

    let path = Path.join(APP_ROOT, 'src/wwwroot/misc/enter_license.html');
    path = `file://${path}`
    win.loadURL(path);
  }
}

function licenseFilePath() {
  let real_app = remote ? remote.app : app;
  let userdatapath = real_app.getPath('userData');
  return Path.join(userdatapath, 'license.jwt');
}

export function enterLicense(license:string) {
  verifyLicense(license);
  fs.writeFileSync(licenseFilePath(), license.trim(), {encoding:'utf8'});
  ISREGISTERED = true;
}

export function nag() {
  if (!isRegistered()) {
    console.log('nag');
  }
}

export function eventuallyNag() {
  if (!isRegistered()) {
    setTimeout(() => {
      nag();
    }, 15 * 60 * 1000)
  }
}

function verifyLicense(license:string) {
  jwt.verify(license.trim(), PUBKEY, {
    algorithms: ['RS256'],
  });
}

export const DEAR_HACKER = `Dear Hacker,

You've found it.  If you REALLY want to steal this application instead
of buying it, here's the really weak DRM.  It's intentionally weak.
But you'll be happier if you're honest.  I promise :)

This app's licensing is rather generous and inexpensive.  Is it really
worth it to steal?  See for yourself at https://www.bucketsisbetter.com/

Thanks,

Matt Haggard (the author)`;

const PUBKEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAnvWhNTROSduI+j2QsePY
qYsiQ+mZkalmushhVwQOVZJIZOluGS9J6tYU4FA91yDBE63yQc3/RhBL0ypBRrym
uodKnPQwzbLtVGtp/fhxwfZpoyL7BlrSn5vMrhOKkImD8bHvHlayT50g/CJNoHpX
5ShYK5J+l6MdU+ICS64Ou4Yls9PHDvY8OuW8JVsilyPMRrq0UHZrBF24sWRNBg1T
5x5GpWxkn8QPVHEhzHgjQNCXXY0bn9J+Wr0gx97dOklnyKCCICwPHuamgqnJp8+F
Pu5nK9DKeCxEK2yUcCV8Fz2zKw0s1GBwcGJzFOaApDVagu2r8DVNkmcCEJMQp1Ff
9sl1ykTC4qTBBMf1e20asbfijbD4lIybCMK/exo+9JH/GSIfWjeP4VWBcWYn5FLM
ELcP0McIAZIKF6L8u1Y3EdbJq6WiDeFbFI8LrsbccjLYWbC9d1dcjDKxJuPLBT2b
dZglL5mqBT8XiTG1z6TLlqwzb96rzQGDjRVa6eiLn2brooFFdjlz0jVDja/ZGYMT
DYbdTet5pDmTpcDkuLE++fOAwGGiNRcRO5E05hRfDrS5utXkcK3BbsfLTAXT9CVT
cLTH3Kyxux83y2wLlmFzaQfYN2eNY8sD/hFxUNxISps3cFvMrq9L44LoqH0xF7cz
E9ocvbXaPIAKtbUbbIRg06sCAwEAAQ==
-----END PUBLIC KEY-----`;

// function initial

// let userdatapath = app.getPath('userData');
//   return Path.join(userdatapath, 'preferences.json');