import {
  SQLite,
  // FileSystem,
  // DocumentPicker,
} from 'expo';
import {
  WebSQLDatabase
} from './exposqlite'
import {
  SQLiteStore
} from 'buckets-core/dist/dbstore'
// import { Bucket } from 'buckets-core/dist/models/bucket'

export async function dostuff() {
  const _db = SQLite.openDatabase(":memory:");
  const store = new SQLiteStore(new WebSQLDatabase(_db), null as any);

  await store.doSetup();
  // let bucket:Bucket = await store.sub.buckets.add({name: 'New bucket'})
  // console.log('bucket', bucket);
}