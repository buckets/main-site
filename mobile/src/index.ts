import { SQLite, FileSystem, DocumentPicker } from 'expo';

export async function dostuff():string {
  console.log('stuff done');

  // const result = await DocumentPicker.getDocumentAsync({
  //   type: '*/*',
  // })
  // console.log('result', result);

  const db = SQLite.openDatabase("test.db");
  await new Promise<any>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'select sqlite_version()',
        [],
        (_, result) => {
          console.log('result', result);
          console.log('rows', result.rows._array);
          resolve(null);
        }
      )
    })
  })

  try {
    const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory)
    console.log("info", info);  
  } catch(err) {
    console.log('Error accessing file', err);
  }

  const items = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory)
  console.log('items', items);
}