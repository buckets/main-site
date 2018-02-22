import { DBStore } from './mainprocess/dbstore'
import { PrefixLogger } from './logging'

const log = new PrefixLogger('(undo)')


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
  private checkpoint_id:number = null;
  constructor(private store:DBStore) {

  }
  async start() {
    const sql = `
      CREATE TEMP TABLE undo_status (
        enabled TEXT
      );
      INSERT INTO undo_status (enabled) values (1);

      CREATE TEMP TABLE undo_checkpoint (
        id INTEGER PRIMARY KEY,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        undo_log_id INTEGER,
        label TEXT
      );
      
      CREATE TEMP TABLE undo_log (
        id INTEGER PRIMARY KEY,
        created INTEGER DEFAULT((julianday('now') - 2440587.5)*86400000),
        table_name TEXT,
        object_id INTEGER,
        sql TEXT
      );
    `;
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
    await this.store.exec(sql);
  }

  /**
   *  Run a function that can be undone.
   */
  async doAction<T>(label:string, func:(...args)=>T|Promise<T>):Promise<T> {
    const action_id = await this.startAction(label);
    try {
      return await func()
    } catch(err) {
      throw err;
    } finally {
      await this.finishAction(action_id);
    }
  }
  async startAction(label:string):Promise<number> {
    const nested = this.checkpoint_id !== null;

    if (nested) {
      // nested action
      return null;
    } else {
      // outermost action
      let result = await this.store.db.run('INSERT INTO undo_checkpoint (label, undo_log_id) VALUES ($label, (SELECT COALESCE(max(id), 0) FROM undo_log))', {$label: label})
      this.checkpoint_id = result.lastID;  
      log.info('Marking checkpoint', this.checkpoint_id, label);
      return this.checkpoint_id;
    }
  }
  async finishAction(id:number) {
    if (id === null) {
      return;
    } else if (id === this.checkpoint_id) {
      log.info('Finish action');
      this.checkpoint_id = null;
    } else {
      log.error('Error finishing action.  Mismatched id', this.checkpoint_id, id);
    }
  }

  /**
   *  Undo the last performed action
   */
  async undoLastAction() {
    console.log('undoing last action');
    let rows = await this.store.query(`
      SELECT id, table_name, object_id, sql
      FROM undo_log
      WHERE id > (SELECT COALESCE(MAX(undo_log_id), 0) FROM undo_checkpoint)
    `, {})

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

    sqls.push('DELETE FROM undo_checkpoint WHERE id = (SELECT MAX(id) FROM undo_checkpoint)')
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
