import {
  SQLite,
  FileSystem,
  // DocumentPicker,
} from 'expo';
import {
  sqlo2a
} from './exposqlite'

export async function dostuff() {
  console.log('stuff done');
  console.log('Query:', sqlo2a(
    'SELECT foo, $something, $a, $aoo FROM ho WHERE a = $a or b = $something',
    {
      $something: 'hello',
      $a: 'another thing',
      $aoo: 'hoopa',
    }
  ));

  // const result = await DocumentPicker.getDocumentAsync({
  //   type: '*/*',
  // })
  // console.log('result', result);

  // const db = SQLite.openDatabase("test.db");
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