interface Crypter {
  encrypt(plaintext:string, password:string):Promise<string>;
  decrypt(ciphertext:string, password:string):Promise<string>;
}


class TriplesecCrypter implements Crypter {
  async triplesec() {
    return import('triplesec')
  }
  async encrypt(plaintext:string, password:string):Promise<string> {
    const triplesec = await this.triplesec();
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
    const triplesec = await this.triplesec();
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

class AESCrypter implements Crypter {
  async encrypt(plaintext:string, password:string):Promise<string> {
    const cryptojs = await import('crypto-js');
    return cryptojs.AES.encrypt(plaintext, password).toString();
  }
  async decrypt(ciphertext:string, password:string):Promise<string> {
    const cryptojs = await import('crypto-js');
    const bytes = cryptojs.AES.decrypt(ciphertext, password);
    return bytes.toString(cryptojs.enc.Utf8);
  }
}

const CRYPTERS = {
  '0': TriplesecCrypter,
  '1': AESCrypter,
}
const LATEST = '1';

/**
 *  Encrypt some plaintext with a password
 */
export async function encrypt(plaintext:string, password:string):Promise<string> {
  let crypter = new CRYPTERS[LATEST]();
  let ciphertext = await crypter.encrypt(plaintext, password)
  return `buckets:${LATEST}:${ciphertext}`
}

/**
 *  Decrypt a ciphertext using a password
 */
export async function decrypt(ciphertext:string, password:string):Promise<string> {
  let parsed = getCipherEncryptionVersion(ciphertext);
  let crypter = new CRYPTERS[parsed.version]();
  return crypter.decrypt(parsed.ciphertext, password);
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
  return parsed.version === LATEST
}

