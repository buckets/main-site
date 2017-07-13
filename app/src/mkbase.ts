#!/usr/bin/env node
import { DBStore } from './mainprocess/dbstore';

if (require.main === module) {
  let dst = process.argv[2];
  if (dst) {
    let store = new DBStore(dst);
    store.open()
    .then(store => {
      console.log(`wrote ${dst}`)
    })  
  } else {
    console.log('you must provide a filename')
  }
}
