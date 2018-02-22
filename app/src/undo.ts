import { IStore } from './store'
import { PrefixLogger } from './logging'

const log = new PrefixLogger('(undo)')

// import { Account } from './models/account'


// function trackChangeTriggers<T extends IObject>(cls:IObjectClass<T>, columns:Array<keyof T>) {
//   return [
//     `CREATE TEMP TABLE x_${cls.type} (
//       x_id INTEGER PRIMARY KEY,
//       x_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       x_op TEXT,

//       ${columns.map(col => `${col} TEXT`).join(',')}
//     )`,
//     `CREATE TEMP TRIGGER x_${cls.type}_insert
//       AFTER INSERT ON ${cls.type}
//       BEGIN
//         INSERT INTO x_${cls.type} (x_op, id) VALUES ('INSERT', NEW.id);
//       END
//     `,
//     `CREATE TEMP TRIGGER x_${cls.type}_update
//       AFTER UPDATE ON ${cls.type}
//       BEGIN
//         INSERT INTO x_${cls.type}
//     `,
//   ]
// }

interface SqliteTableInfoRow {
  cid: number;
  name: string;
  type: 'INTEGER'|'TIMESTAMP'|'TEXT'|'TINYINT';
  notnull?: number;
  pk?: number;
  dflt_value?: string;
}

export class UndoTracker {

  // milliseconds window that groups actions together
  private threshold = 120;
  constructor(private store:IStore) {

  }
  async start() {
    const sql = `
      CREATE TEMP TABLE undo_status (
        enabled TEXT
      );
      INSERT INTO undo_status (enabled) values (1);
      
      CREATE TEMP TABLE undo_log (
        id INTEGER PRIMARY KEY,
        created INTEGER DEFAULT((julianday('now') - 2440587.5)*86400000),
        table_name TEXT,
        object_id INTEGER,
        sql TEXT
      );
    `;
    console.log('sql', sql);
    try {
      await this.store.exec(sql);  
    } catch(err) {
      log.error('Error setting up undo_log', sql);
      log.error(err.stack)
    }

    await this.enableTable('account');
    await this.enableTable('account_transaction');
    await this.enableTable('bucket');
    await this.enableTable('bucket_transaction');
    await this.enableTable('bucket_group');
  }
  async enableTable(table_name:string) {
    console.log('enabling undo for', table_name);
    const columns = Array.from(await this.store.query(`pragma table_info(${table_name})`, {})) as SqliteTableInfoRow[];

    const sql = `
      -- INSERT
      CREATE TEMP TRIGGER x_${table_name}_insert
      AFTER INSERT ON ${table_name}
      WHEN (SELECT enabled FROM undo_status) = 1
      BEGIN
        INSERT INTO undo_log (table_name, object_id, sql)
          VALUES('${table_name}', NEW.id,
            'DELETE FROM ${table_name} WHERE rowid=' || NEW.rowid);
      END;

      -- UPDATE
      CREATE TEMP TRIGGER x_${table_name}_update
      AFTER UPDATE ON ${table_name}
      WHEN (SELECT enabled FROM undo_status) = 1
      BEGIN
        INSERT INTO undo_log (table_name, object_id, sql)
          VALUES('${table_name}', OLD.id,
            'UPDATE ${table_name} SET ${columns.map(col => {
            return `${col.name}='||quote(old.${col.name})||'`;
          }).join(',')} WHERE rowid='||old.rowid);
      END;

      -- DELETE
      CREATE TEMP TRIGGER x_${table_name}_delete
      BEFORE DELETE ON ${table_name}
      WHEN (SELECT enabled FROM undo_status) = 1
      BEGIN
        INSERT INTO undo_log (table_name, object_id, sql)
          VALUES('${table_name}', OLD.id,
            'INSERT INTO ${table_name} (rowid,${columns.map(col => col.name).join(',')}) VALUES ('||old.rowid||',${columns.map(col => `'||quote(old.${col.name})||'`).join(',')})');
      END;
    `
    console.log('sql', sql);
    await this.store.exec(sql);
  }
  async disableUndoRecording() {
    await this.store.query('UPDATE undo_status SET enabled=0', {});
  }
  async enableUndoRecording() {
    await this.store.query('UPDATE undo_status SET enabled=1', {});
  }

  /**
   *  Undo the last performed action
   */
  async undoLastAction() {
    console.log('undoing last action');
    let rows = await this.store.query(`
      SELECT id, table_name, object_id, sql
      FROM undo_log,
        (
          WITH RECURSIVE
            what(x) AS (
                SELECT max(created) FROM undo_log
                UNION
                SELECT undo_log.created FROM what, undo_log
                WHERE undo_log.created >= (what.x - $threshold)
            )
          SELECT max(x) as upper, min(x) as lower FROM what
        ) as limits
      WHERE
        created >= limits.lower
        AND created <= limits.upper
      `, {$threshold: this.threshold})

    console.log('rows', rows);
    
    let sqls = ['UPDATE undo_status SET enabled=0'];

    let deleted_objects:Array<{
      table_name: string;
      object_id: number;
    }> = [];
    let updated_objects:Array<{
      table_name: string;
      object_id: number;
    }> = [];
    
    for (const {id, sql, table_name, object_id} of rows) {
      sqls.push(sql);
      sqls.push(`DELETE FROM undo_log WHERE id=${id}`);
      if (sql.startsWith('DELETE')) {
        deleted_objects.push({
          table_name,
          object_id,
        })
      } else {
        updated_objects.push({
          table_name,
          object_id,
        })
      }
    }

    sqls.push('UPDATE undo_status SET enabled=1')

    const full_sql = sqls.join(';');
    console.log('undo SQL', full_sql);

    await this.store.exec(full_sql);

    return {
      deleted: deleted_objects,
      updated: updated_objects,
    }
    // const rows = await this.store.query('SELECT * FROM undo_log WHERE action_id=(SELECT max(action_id) FROM undo_action)', {});
    // let action_id = null;
    // for (const row of rows) {
    //   action_id = row.action_id;
    //   console.log('row', row);
    // }
    // if (action_id) {
    //   let p1 = this.store.query('DELETE FROM undo_action WHERE id=$action_id', {$action_id: action_id})
    //   let p2 = this.store.query('DELETE FROM undo_log WHERE action_id=$action_id', {$action_id: action_id})
    //   await Promise.all([p1, p2]);
    // }
  }
}
