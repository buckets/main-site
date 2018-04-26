import { SQLite } from 'expo';

export function dostuff():string {
  console.log('stuff done');

  const db = SQLite.openDatabase("test.db");
  db.transaction(tx => {
    tx.executeSql(
      'select sqlite_version()',
      [],
      (_, result) => {
        console.log('result', result);
        console.log('rows', result.rows._array);
      }
    )
  })
  return 'x'
}