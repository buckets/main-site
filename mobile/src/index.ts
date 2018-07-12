import {
  SQLite,
  // FileSystem,
  // DocumentPicker,
} from 'expo';
import {
  WebSQLDatabase
} from './exposqlite'
import {
  SQLiteStore,
} from 'buckets-core/dist/dbstore'
import {
  IUserInterfaceFunctions
} from 'buckets-core/dist/store'
import { Bucket } from 'buckets-core/dist/models/bucket'

class MobileUIFunctions implements IUserInterfaceFunctions {
  attachStore(store) {

  }
}

export async function dostuff() {
  const _db = SQLite.openDatabase("gooba7");
  const store = new SQLiteStore(new WebSQLDatabase(_db), new MobileUIFunctions());

  try {
    await store.doSetup();  
  } catch(err) {
    console.log('Error FROM dostuff', err);
    return;
  }
  
  let bucket:Bucket = await store.sub.buckets.add({name: 'New bucket'})
  console.log('bucket', bucket);
}