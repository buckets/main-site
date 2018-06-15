import * as triplesec from 'triplesec'


/**
 *  Encrypt some plaintext with a password
 */
export function encrypt(plaintext:string, password:string):Promise<string> {
  return new Promise((resolve, reject) => {
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

/**
 *  Decrypt a ciphertext using a password
 */
export function decrypt(ciphertext:string, password:string):Promise<string> {
  return new Promise((resolve, reject) => {
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

