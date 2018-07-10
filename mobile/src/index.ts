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
import { Bucket } from 'buckets-core/dist/models/bucket'

export async function dostuff() {
  const _db = SQLite.openDatabase(":memory:");
  const store = new SQLiteStore(new WebSQLDatabase(_db), null as any);

  await store.doSetup();
  let bucket:Bucket = await store.sub.buckets.add({name: 'New bucket'})
  console.log('bucket', bucket);
  
  // await new Promise<any>((resolve, reject) => {
  //   db.transaction(tx => {
  //     tx.executeSql(
  //       'select sqlite_version() as theversion',
  //       [],
  //       (_, result) => {
  //         console.log('result', result);
  //         console.log('rows', result.rows._array);
  //         resolve(null);
  //       }
  //     )
  //   })
  // })

  // try {
  //   const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory)
  //   console.log("info", info);  
  // } catch(err) {
  //   console.log('Error accessing file', err);
  // }

  // const items = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory)
  // console.log('items', items);
}