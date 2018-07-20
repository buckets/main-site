import * as cryptojs from 'crypto-js'
import { PrefixLogger } from './logging'

const log = new PrefixLogger('(crypto)')

export interface Crypter {
  encrypt(plaintext:string, password:string):Promise<string>;
  decrypt(ciphertext:string, password:string):Promise<string>;
}


//------------------------------------------------------------
// Triplesec (deprecated)
//------------------------------------------------------------
export interface ITriplesecModule {
  encrypt(args:{key:Buffer, data:Buffer}, callback:(err:Error, ciphertext:Buffer)=>void);
  decrypt(args:{key:Buffer, data:Buffer}, callback:(err:Error, plaintext:Buffer)=>void);
}
let triplesec:ITriplesecModule = null;
export class TriplesecCrypter implements Crypter {
  static setPackage(mod:ITriplesecModule) {
    triplesec = mod;
  }
  async encrypt(plaintext:string, password:string):Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let key = new Buffer(password, 'utf8')
      let ptbuffer = new Buffer(plaintext, 'utf8')
      triplesec.encrypt({key, data:ptbuffer}, (err, ciphertext) => {
        if (err) {
          reject(err);
        } else {
          resolve(ciphertext.toString('base64'))  
        }
      })
    })
  }
  async decrypt(ciphertext:string, password:string):Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let key = new Buffer(password, 'utf8')
      let ctbuffer = new Buffer(ciphertext, 'base64')
      triplesec.decrypt({key, data:ctbuffer}, (err, plaintext) => {
        if (err) {
          reject(err);
        } else {
          resolve(plaintext.toString('utf8'))  
        }
      })
    })
  }
}

//------------------------------------------------------------
// AES v1
//------------------------------------------------------------
class AESCrypter implements Crypter {
  async encrypt(plaintext:string, password:string):Promise<string> {
    return cryptojs.AES.encrypt(plaintext, password).toString();
  }
  async decrypt(ciphertext:string, password:string):Promise<string> {
    const bytes = cryptojs.AES.decrypt(ciphertext, password);
    return bytes.toString(cryptojs.enc.Utf8);
  }
}

//------------------------------------------------------------

const CRYPTERS = {
  '0': TriplesecCrypter,
  '1': AESCrypter,
}
export const LATEST_VERSION = '1';
export const LATEST_ENC_PREFIX = `buckets:${LATEST_VERSION}:`;

/**
 *  Encrypt some plaintext with a password
 */
export async function encrypt(plaintext:string, password:string):Promise<string> {
  let crypter = new CRYPTERS[LATEST_VERSION]();
  let ciphertext = await crypter.encrypt(plaintext, password)
  return `${LATEST_ENC_PREFIX}${ciphertext}`
}

/**
 *  Decrypt a ciphertext using a password
 */
export async function decrypt(ciphertext:string, password:string):Promise<string> {
  let parsed = getCipherEncryptionVersion(ciphertext);
  log.info(`Decrypting using version: ${parsed.version}`);
  let crypter = new CRYPTERS[parsed.version]();
  try {
    return await crypter.decrypt(parsed.ciphertext, password);
  } catch(err) {
    log.info(`Decryption error: ${err}`);
    throw err;
  }
}

function getCipherEncryptionVersion(ciphertext:string):{version:string, ciphertext:string} {
  let version:string;
  if (ciphertext.startsWith('buckets:')) {
    // versioned ciphertext
    const parts = ciphertext.split(':', 2);
    version = parts[1];
    ciphertext = ciphertext.substr(`buckets:${version}:`.length);
  } else {
    // non-versioned ciphertext, so version 0
    version = '0';
  }
  return {version, ciphertext}
}

/**
 *  Return whether an encrypted string is using the
 *  latest encryption method.
 */
export function isEncryptionLatest(ciphertext:string):boolean {
  let parsed = getCipherEncryptionVersion(ciphertext);
  return parsed.version === LATEST_VERSION
}

/**
 *  Upgrade a ciphertext to the latest encryption method.
 */
export async function upgradeEncryption(ciphertext:string, password:string):Promise<string> {
  const plain = await decrypt(ciphertext, password);
  return await encrypt(plain, password);
}

