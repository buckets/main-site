import { encrypt, decrypt } from './crypto'
import * as tap from 'tap';


tap.test('works', async t => {
  let encrypted = await encrypt('message', 'password');
  console.log('encrypted', encrypted);
  let decrypted = await decrypt(encrypted, 'password');
  console.log('decrypted', decrypted);
  t.equals(decrypted, 'message');
})
