import * as moment from 'moment-timezone'
import { ts2localdb, utcToLocal } from '../time'
import { PrefixLogger } from '../logging'
import { IAsyncSqlite } from '../dbstore'

const log = new PrefixLogger('(jsmig)');

function SQLList(sqls:string[]) {
  return function(db:IAsyncSqlite) {
    return db.executeMany(sqls)
  }
}

/**
 *  Database migration
 */
export interface IMigration {
  name: string;
  func: (db:IAsyncSqlite)=>Promise<any>;
}

export const migrations:IMigration[] = [
  {
    name: 'initial',
    func: SQLList([
    `CREATE TABLE account (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name TEXT DEFAULT '',
        balance INTEGER DEFAULT 0,
        currency TEXT
    )`,
    `CREATE TABLE account_transaction (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        account_id INTEGER,
        amount INTEGER,
        memo TEXT,
        fi_id TEXT,
        general_cat TEXT DEFAULT '',
        FOREIGN KEY(account_id) REFERENCES account(id)
    )`,
    `CREATE INDEX account_transaction_posted
        ON account_transaction(posted)`,
    `CREATE INDEX account_transaction_fi_id
        ON account_transaction(fi_id)`,

    `CREATE TRIGGER update_account_balance_insert
        AFTER INSERT ON account_transaction
        BEGIN
            UPDATE account SET balance = balance + new.amount WHERE id = new.account_id;
        END`,
    `CREATE TRIGGER update_account_balance_delete
        AFTER DELETE ON account_transaction
        BEGIN
            UPDATE account SET balance = balance - old.amount WHERE id = old.account_id;
        END`,
    `CREATE TRIGGER update_account_balance_update
        AFTER UPDATE ON account_transaction
        BEGIN
            UPDATE account SET balance = balance - old.amount WHERE id = old.account_id;
            UPDATE account SET balance = balance + new.amount WHERE id = new.account_id;
        END`,

    `CREATE TABLE bucket_group (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name TEXT,
        ranking TEXT
    )`,

    `CREATE TABLE bucket (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name TEXT,
        notes TEXT DEFAULT '',
        balance INTEGER DEFAULT 0,
        kicked TINYINT DEFAULT 0,
        group_id INTEGER default NULL,
        ranking TEXT default '',
        kind TEXT default '',
        goal INTEGER,
        end_date DATE,
        deposit INTEGER,
        color TEXT,
        FOREIGN KEY(group_id) REFERENCES bucket_group(id)
    )`,

    `CREATE TABLE bucket_transaction (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        bucket_id INTEGER,
        amount INTEGER,
        memo TEXT,
        account_trans_id INTEGER,
        transfer TINYINT DEFAULT 0,
        FOREIGN KEY(bucket_id) REFERENCES bucket(id)
    )`,

    `CREATE INDEX bucket_transaction_posted
        ON bucket_transaction(posted)`,
    `CREATE INDEX bucket_transaction_account_trans_id
        ON bucket_transaction(account_trans_id)`,

    `CREATE TRIGGER update_bucket_balance_insert
        AFTER INSERT ON bucket_transaction
        BEGIN
            UPDATE bucket SET balance = balance + new.amount WHERE id = new.bucket_id;
        END`,
    `CREATE TRIGGER update_bucket_balance_delete
        AFTER DELETE ON bucket_transaction
        BEGIN
            UPDATE bucket SET balance = balance - old.amount WHERE id = old.bucket_id;
        END`,
    `CREATE TRIGGER update_bucket_balance_update
        AFTER UPDATE ON bucket_transaction
        BEGIN
            UPDATE bucket SET balance = balance - old.amount WHERE id = old.bucket_id;
            UPDATE bucket SET balance = balance + new.amount WHERE id = new.bucket_id;
        END`,
    `CREATE TABLE simplefin_connection (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        access_token TEXT,
        last_used TIMESTAMP
    )`,
    `CREATE TABLE account_mapping (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        account_id INTEGER,
        account_hash TEXT,
        FOREIGN KEY(account_id) REFERENCES account(id)
    )`,
    `CREATE TABLE unknown_account (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        account_hash TEXT
    )`,
    `CREATE UNIQUE INDEX unknown_account_hash ON unknown_account(account_hash)`,
    ]),
  },
  {
    name: 'import_balance',
    func: SQLList([`ALTER TABLE account ADD COLUMN import_balance INTEGER DEFAULT NULL`]),
  },
  {
    name: 'deletetrans',
    func: SQLList([
      `CREATE TRIGGER account_transaction_delete
        AFTER DELETE ON account_transaction
        BEGIN
            DELETE FROM bucket_transaction WHERE account_trans_id=OLD.id;
        END`,

      // clean up the old ones
      `DELETE FROM bucket_transaction
        WHERE
            account_trans_id IS NOT NULL
            AND account_trans_id NOT IN (SELECT id FROM account_transaction)`,
    ]),
  },
  {
    name: 'dearhacker',
    func: SQLList([
      `CREATE TABLE _dear_hacker (
          id INTEGER PRIMARY KEY,
          note TEXT
      )`,
      `INSERT INTO _dear_hacker (note) VALUES ('As you can probably tell, this file is just an SQLite file.  You are welcome to hack it in any way you want -- it doesn''t void the warranty or anything :)  Just be careful, and be aware that the schema might change without warning from version to version.')`,
    ]),
  },
  {
    name: 'bankmacro',
    func: SQLList([
      `CREATE TABLE bank_macro (
          id INTEGER PRIMARY KEY,
          created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          uuid TEXT,
          name TEXT,
          enc_recording TEXT,
          enabled TINYINT default 1
      )`,

      `CREATE UNIQUE INDEX account_mapping_hash ON account_mapping(account_hash)`,
    ]),
  },
  {
    name: 'closeaccount',
    func: SQLList([
      `ALTER TABLE account ADD COLUMN closed TINYINT DEFAULT 0`,
    ]),
  },
  {
    name: 'notes',
    func: SQLList([
      `ALTER TABLE account ADD COLUMN notes TEXT DEFAULT ''`,
      `UPDATE account SET notes = ''`,
      `ALTER TABLE account_transaction ADD COLUMN notes TEXT DEFAULT ''`,
      `UPDATE account_transaction SET notes = ''`,
      `ALTER TABLE bucket_transaction ADD COLUMN notes TEXT DEFAULT ''`,
      `UPDATE bucket_transaction SET notes = ''`,
      `ALTER TABLE bucket_group ADD COLUMN notes TEXT DEFAULT ''`,
      `UPDATE bucket_group SET notes = ''`,
    ]),
  },
  {
    name: 'csvimport',
    func: SQLList([
      `CREATE TABLE csv_import_mapping (
          id INTEGER PRIMARY KEY,
          created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fingerprint_hash TEXT,
          mapping_json TEXT
      )`
    ]),
  },
  {
    name: 'triggercontrol-andundo',
    func: SQLList([
      // Drop them all
      `DROP TRIGGER update_account_balance_insert`,
      `DROP TRIGGER update_account_balance_delete`,
      `DROP TRIGGER update_account_balance_update`,
      `DROP TRIGGER update_bucket_balance_insert`,
      `DROP TRIGGER update_bucket_balance_delete`,
      `DROP TRIGGER update_bucket_balance_update`,
      `DROP TRIGGER account_transaction_delete`,

      // Recreate the triggers with new WHEN
      `CREATE TABLE x_trigger_disabled (
          col TINYINT
      )`,
      `CREATE TRIGGER update_account_balance_insert
          AFTER INSERT ON account_transaction
          WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
          BEGIN
              UPDATE account SET balance = balance + new.amount WHERE id = new.account_id;
          END`,
      `CREATE TRIGGER update_account_balance_delete
          AFTER DELETE ON account_transaction
          WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
          BEGIN
              UPDATE account SET balance = balance - old.amount WHERE id = old.account_id;
          END`,
      `CREATE TRIGGER update_account_balance_update
          AFTER UPDATE ON account_transaction
          WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
          BEGIN
              UPDATE account SET balance = balance - old.amount WHERE id = old.account_id;
              UPDATE account SET balance = balance + new.amount WHERE id = new.account_id;
          END`,
      `CREATE TRIGGER update_bucket_balance_insert
          AFTER INSERT ON bucket_transaction
          WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
          BEGIN
              UPDATE bucket SET balance = balance + new.amount WHERE id = new.bucket_id;
          END`,
      `CREATE TRIGGER update_bucket_balance_delete
          AFTER DELETE ON bucket_transaction
          WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
          BEGIN
              UPDATE bucket SET balance = balance - old.amount WHERE id = old.bucket_id;
          END`,
      `CREATE TRIGGER update_bucket_balance_update
          AFTER UPDATE ON bucket_transaction
          WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
          BEGIN
              UPDATE bucket SET balance = balance - old.amount WHERE id = old.bucket_id;
              UPDATE bucket SET balance = balance + new.amount WHERE id = new.bucket_id;
          END`,
      `CREATE TRIGGER account_transaction_delete
          AFTER DELETE ON account_transaction
          WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
          BEGIN
              DELETE FROM bucket_transaction WHERE account_trans_id=OLD.id;
          END`,
    ]),
  },
  {
    name: 'postedtolocal',
    async func(db:IAsyncSqlite) {
      let updates = [];

      /**
       *  Parse a UTC time with a backward offset
       */
      function convertPostedToLocal(x:string):string {
        let mom = moment.tz(x, 'UTC');
        let local = utcToLocal(mom);
        let fudged = mom.clone().subtract(2*local.utcOffset(), 'minutes');
        return ts2localdb(fudged);
      }

      const a_rows = await db.all<any>('SELECT id, posted FROM account_transaction ORDER BY posted')
      for (const a_row of a_rows) {
        const new_posted = convertPostedToLocal(a_row.posted);
        log.info(`Changing atrans ${a_row.id} ${a_row.posted} -> ${new_posted}`);
        updates.push(`UPDATE account_transaction SET posted='${new_posted}' WHERE id='${a_row.id}'`)
      }

      const b_rows = await db.all<any>('SELECT id, posted FROM bucket_transaction ORDER BY posted')
      for (const b_row of b_rows) {
        const new_posted = convertPostedToLocal(b_row.posted);
        log.info(`Changing btrans ${b_row.id} ${b_row.posted} -> ${new_posted}`);
        updates.push(`UPDATE bucket_transaction SET posted='${new_posted}' WHERE id='${b_row.id}'`)
      }

      await db.executeMany(updates);
    }
  },
  {
    name: 'nullamounttriggers',
    func: SQLList([
    // Drop them all
    `DROP TRIGGER update_account_balance_insert`,
    `DROP TRIGGER update_account_balance_delete`,
    `DROP TRIGGER update_account_balance_update`,
    `DROP TRIGGER update_bucket_balance_insert`,
    `DROP TRIGGER update_bucket_balance_delete`,
    `DROP TRIGGER update_bucket_balance_update`,

    // Recreate the triggers with coalescing in place
    `CREATE TRIGGER update_account_balance_insert
        AFTER INSERT ON account_transaction
        WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
        BEGIN
            UPDATE account SET balance = coalesce(balance,0) + coalesce(new.amount,0) WHERE id = new.account_id;
        END`,
    `CREATE TRIGGER update_account_balance_delete
        AFTER DELETE ON account_transaction
        WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
        BEGIN
            UPDATE account SET balance = coalesce(balance,0) - coalesce(old.amount,0) WHERE id = old.account_id;
        END`,
    `CREATE TRIGGER update_account_balance_update
        AFTER UPDATE ON account_transaction
        WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
        BEGIN
            UPDATE account SET balance = coalesce(balance,0) - coalesce(old.amount,0) WHERE id = old.account_id;
            UPDATE account SET balance = coalesce(balance,0) + coalesce(new.amount,0) WHERE id = new.account_id;
        END`,
    `CREATE TRIGGER update_bucket_balance_insert
        AFTER INSERT ON bucket_transaction
        WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
        BEGIN
            UPDATE bucket SET balance = coalesce(balance,0) + coalesce(new.amount,0) WHERE id = new.bucket_id;
        END`,
    `CREATE TRIGGER update_bucket_balance_delete
        AFTER DELETE ON bucket_transaction
        WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
        BEGIN
            UPDATE bucket SET balance = coalesce(balance,0) - coalesce(old.amount,0) WHERE id = old.bucket_id;
        END`,
    `CREATE TRIGGER update_bucket_balance_update
        AFTER UPDATE ON bucket_transaction
        WHEN (SELECT count(*) FROM x_trigger_disabled) = 0
        BEGIN
            UPDATE bucket SET balance = coalesce(balance,0) - coalesce(old.amount,0) WHERE id = old.bucket_id;
            UPDATE bucket SET balance = coalesce(balance,0) + coalesce(new.amount,0) WHERE id = new.bucket_id;
        END`,

    `UPDATE account_transaction SET amount=0 WHERE amount IS NULL`,
    `UPDATE bucket_transaction SET amount=0 WHERE amount IS NULL`,

    // fix broken balances
    `UPDATE account
    SET balance = COALESCE((SELECT SUM(COALESCE(amount, 0))
                   FROM account_transaction
                   WHERE account_id = account.id), 0)
    WHERE balance IS NULL`,
    ]),
  },
  {
    name: 'settings',
    func: SQLList([
      `CREATE TABLE settings (
          id INTEGER PRIMARY KEY,
          created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          key TEXT,
          value TEXT
      )`,
      `CREATE TRIGGER there_can_be_only_one_setting
          BEFORE INSERT ON settings
          BEGIN
              DELETE FROM settings WHERE key=NEW.key;
          END`,
    ]),
  },
  {
    name: 'offbudget',
    func: SQLList([
      `ALTER TABLE account ADD COLUMN offbudget TINYINT DEFAULT 0`,
    ]),
  },
  {
    name: 'cleared',
    func: SQLList([
      `ALTER TABLE account_transaction ADD COLUMN cleared TINYINT DEFAULT 0`,
      `UPDATE account_transaction SET cleared = 1`,
    ]),
  },
]
