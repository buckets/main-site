import {
  SQLite,
  // FileSystem,
  // DocumentPicker,
} from 'expo';
import {
  ExpoSQLiteDatabase
} from './exposqlite'
import {
  SQLiteStore,
} from 'buckets-core/dist/dbstore'
import {
  IUserInterfaceFunctions
} from 'buckets-core/dist/store'
import { Bucket } from 'buckets-core/dist/models/bucket'

class HTTPRequester {
  fetchBody(args:any):Promise<string> {
    return Promise.resolve('');
  }
}

class MobileUIFunctions implements IUserInterfaceFunctions {
  attachStore(store) {

  }
  http = new HTTPRequester();
}

const dbname = `gooba${(new Date()).getTime()}.sqlite`;

export async function dostuff() {
  // const init_sqls = [
  //   `CREATE TEMP TABLE undo_status (
  //     direction TEXT,
  //     temporary TINYINT DEFAULT 0
  //   )`,
  //   `INSERT INTO undo_status (direction) values ('undo')`,

  //   `CREATE TEMP TABLE undo_checkpoint (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //     undo_log_id INTEGER,
  //     direction TEXT,
  //     label TEXT
  //   )`,
    
  //   `CREATE TEMP TABLE undo_log (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     table_name TEXT,
  //     object_id INTEGER,
  //     direction TEXT,
  //     sql TEXT
  //   )`,

  //   `CREATE TEMP TRIGGER wipe_redos
  //   AFTER INSERT ON undo_checkpoint
  //   WHEN
  //     NEW.direction = 'undo'
  //     AND (SELECT temporary FROM undo_status) = 0
  //   BEGIN
  //     DELETE FROM undo_checkpoint WHERE direction='redo';
  //     DELETE FROM undo_log WHERE direction='redo';
  //   END`,
  // ];
  const db:SQLite.Database = SQLite.openDatabase(dbname);
  // console.log('db._db', db._db, Object.getOwnPropertyNames(db._db));
  // await new Promise((resolve, reject) => {
  //   db._db.all('SELECT 1', {}, (err, rows) => {
  //     console.log('all callback', err, rows);
  //     if (err) {
  //       reject(err);
  //     } else {
  //       resolve(rows);
  //     }
  //   })
  // });
  // await db.transaction(tx => {
  //   const sql = 'PRAGMA user_version'
  //   tx.executeSql(sql, [], (tx, results) => {
  //     console.log('results', results);
  //   }, (tx, err) => {
  //     console.log('error', err);
  //   });
  // },
  // err => {
  //   console.log('error', err);
  // },
  // () => {
  //   console.log('success');
  // })

  const store = new SQLiteStore(new ExpoSQLiteDatabase(db), new MobileUIFunctions());

  try {
    await store.doSetup({
      addBucketsLicenseBucket: false,
      openNewerSchemas: true,
    })
  } catch(err) {
    console.log('Error FROM dostuff', err);
    return;
  }
  
  console.log('About to make a bucket');
  let bucket:Bucket = await store.sub.buckets.add({name: 'New bucket'})
  console.log('bucket', bucket);
}