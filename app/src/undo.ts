import { DBStore } from './mainprocess/dbstore'
import { PrefixLogger } from './logging'
import { EventSource } from './events'

const log = new PrefixLogger('(undo)')


interface SqliteTableInfoRow {
  cid: number;
  name: string;
  type: 'INTEGER'|'TIMESTAMP'|'TEXT'|'TINYINT';
  notnull?: number;
  pk?: number;
  dflt_value?: string;
}

interface ICheckpoint {
  id: number;
  created: string;
  undo_log_id: number;
  direction: 'undo'|'redo';
  label: string;
}
interface ILogEntry {
  id: number;
  table_name: string;
  object_id: number;
  direction: 'undo'|'redo';
  sql: string;
}

export interface UndoRedoResult {
  deleted: Array<{
    table_name: string;
    object_id: number;
  }>;
  updated: Array<{
    table_name: string;
    object_id: number;
  }>;
}

export class UndoTracker {

  // milliseconds window that groups actions together
  private checkpoint_id:number = null;
  private direction:'undo'|'redo' = 'undo';

  private _nextUndoLabel:string = null;
  private _nextRedoLabel:string = null;

  readonly events = {
    stackchange: new EventSource<'undo'|'redo'>(),
  }

  constructor(private store:DBStore) {

  }
  async start() {
    const sql = `
      CREATE TEMP TABLE undo_status (
        direction TEXT,
        temporary TINYINT DEFAULT 0
      );
      INSERT INTO undo_status (direction) values ('undo');

      CREATE TEMP TABLE undo_checkpoint (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        undo_log_id INTEGER,
        direction TEXT,
        label TEXT
      );
      
      CREATE TEMP TABLE undo_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        object_id INTEGER,
        direction TEXT,
        sql TEXT
      );

      CREATE TEMP TRIGGER wipe_redos
      AFTER INSERT ON undo_checkpoint
      WHEN
        NEW.direction = 'undo'
        AND (SELECT temporary FROM undo_status) = 0
      BEGIN
        DELETE FROM undo_checkpoint WHERE direction='redo';
        DELETE FROM undo_log WHERE direction='redo';
      END;
    `;
    try {
      await this.store.exec(sql);  
    } catch(err) {
      log.error('Error setting up undo_log', sql);
      log.error(err.stack)
      throw err;
    }

    await this.enableTable('account');
    await this.enableTable('account_transaction');
    await this.enableTable('bucket');
    await this.enableTable('bucket_transaction');
    await this.enableTable('bucket_group');

    // XXX switch so that you specify which tables NOT to track
    log.error('HEY MATT, specify the tables NOT to track');
  }

  get nextUndoLabel() {
    return this._nextUndoLabel;
  }
  get nextRedoLabel() {
    return this._nextRedoLabel;
  }

  async logState() {
    let undo_log:ILogEntry[] = await this.store.query('SELECT * FROM undo_log', {});
    let checkpoints:ICheckpoint[] = await this.store.query('SELECT * FROM undo_checkpoint', {});
    log.info('undo_log\n' + undo_log.map(item => {
      return `${item.id} ${item.direction}: ${item.sql}`;
    }).join('\n'));
    
    log.info('undo_checkpoint\n' + checkpoints.map(item => {
      return `${item.id} ${item.direction}: "${item.label}" ${item.undo_log_id}`;
    }).join('\n'))
  }
  async enableTable(table_name:string) {
    const columns = Array.from(await this.store.query(`pragma table_info(${table_name})`, {})) as SqliteTableInfoRow[];

    const sql = `
      -- INSERT
      CREATE TEMP TRIGGER x_${table_name}_insert
      AFTER INSERT ON ${table_name}
      BEGIN
        INSERT INTO undo_log (table_name, object_id, direction, sql)
          VALUES(
            '${table_name}',
            NEW.id,
            (SELECT direction FROM undo_status),
            'DELETE FROM ${table_name} WHERE rowid=' || NEW.rowid);
      END;

      -- UPDATE
      CREATE TEMP TRIGGER x_${table_name}_update
      AFTER UPDATE ON ${table_name}
      BEGIN
        INSERT INTO undo_log (table_name, object_id, direction, sql)
          VALUES(
            '${table_name}',
            OLD.id,
            (SELECT direction FROM undo_status),
            'UPDATE ${table_name} SET ${columns.map(col => {
            return `${col.name}='||quote(old.${col.name})||'`;
          }).join(',')} WHERE rowid='||old.rowid);
      END;

      -- DELETE
      CREATE TEMP TRIGGER x_${table_name}_delete
      BEFORE DELETE ON ${table_name}
      BEGIN
        INSERT INTO undo_log (table_name, object_id, direction, sql)
          VALUES(
            '${table_name}',
            OLD.id,
            (SELECT direction FROM undo_status),
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
      let result = await this.store.db.run(`
        INSERT INTO undo_checkpoint
          (
            label,
            direction,
            undo_log_id
          )
        VALUES (
          $label,
          (SELECT direction FROM undo_status),
          (SELECT COALESCE(max(id), 0) FROM undo_log WHERE direction=$direction)
        )`, {
          $label: label,
          $direction: this.direction,
        })
      this.checkpoint_id = result.lastID;
      if (this.direction === 'undo') {
        this._nextUndoLabel = label;
      } else {
        this._nextRedoLabel = label;
      }
      this.events.stackchange.emit(this.direction);
      return this.checkpoint_id;
    }
  }
  async finishAction(id:number) {
    if (id === null) {
      return;
    } else if (id === this.checkpoint_id) {
      this.checkpoint_id = null;
    } else {
      log.error('Error finishing action.  Mismatched id', this.checkpoint_id, id);
    }
  }

  /**
   *  Undo the last performed action
   */
  async undoLastAction() {
    return this.popStack('undo');
  }
  async redoLastAction() {
    return this.popStack('redo');
  }

  async popStack(direction:'undo'|'redo'):Promise<UndoRedoResult> {
    let rows = await this.store.query(`SELECT * FROM undo_checkpoint WHERE direction=$direction ORDER BY id DESC LIMIT 1`, {$direction: direction});
    const checkpoint:ICheckpoint = rows[0];
    if (!checkpoint) {
      // stack is empty
      return {
        deleted: [],
        updated: [],
      };
    }

    const logitems:ILogEntry[] = await this.store.query(`
      SELECT id, table_name, object_id, sql
      FROM undo_log
      WHERE
        direction = $direction
        AND id > $undo_log_id
    `, {
      $direction: direction,
      $undo_log_id: checkpoint.undo_log_id,
    })

    // XXX This needs to be serialized so that other operations don't sneak in.

    // Switch to recording the opposite direction
    const tmp_direction = this.direction = direction === 'undo' ? 'redo' : 'undo';
    await this.store.query(
      `UPDATE undo_status
       SET
         direction = $tmp_direction,
         temporary = 1`, {
        $tmp_direction: tmp_direction,
      });
    
    let deleted_objects:Array<{
      table_name: string;
      object_id: number;
    }> = [];
    let updated_objects:Array<{
      table_name: string;
      object_id: number;
    }> = [];

    // record the opposite
    await this.doAction(checkpoint.label, async () => {
      let sqls = [];

      // Disable tirggers
      sqls.push(`INSERT INTO x_trigger_disabled (col) VALUES (1)`)

      for (const item of logitems) {

        // Perform action
        sqls.push(item.sql);

        // Prepare to remove action
        sqls.push(`DELETE FROM undo_log WHERE id=${item.id}`);
        
        // Prepare to publish object change
        if (item.sql.startsWith('DELETE')) {
          deleted_objects.push({
            table_name: item.table_name,
            object_id: item.object_id,
          })
        } else {
          updated_objects.push({
            table_name: item.table_name,
            object_id: item.object_id,
          })
        }
      }

      // Enable triggers
      sqls.push(`DELETE FROM x_trigger_disabled`);

      // Remove checkpoint
      sqls.push(`DELETE FROM undo_checkpoint WHERE id = ${checkpoint.id}`)

      const full_sql = sqls.join(';');

      await this.store.exec(full_sql);
    })

    // Switch back to undo mode, which is the default mode
    await this.store.query(
      `UPDATE undo_status
       SET
         direction = 'undo',
         temporary = 0`, {});
    this.direction = 'undo'

    // notify about stack change
    const label_rows = await this.store.query(`
      SELECT direction, label
      FROM (
        SELECT id, direction, label
        FROM undo_checkpoint
        WHERE direction='undo'
        ORDER BY id DESC
        LIMIT 1
      )

      UNION

      SELECT direction, label
      FROM (
        SELECT id, direction, label
        FROM undo_checkpoint
        WHERE direction='redo'
        ORDER BY id DESC
        LIMIT 1
      )
      `, {})
    this._nextRedoLabel = null;
    this._nextUndoLabel = null;
    label_rows.forEach(row => {
      if (row.direction === 'undo') {
        this._nextUndoLabel = row.label;
      } else {
        this._nextRedoLabel = row.label;
      }
    })
    this.events.stackchange.emit(this.direction);

    return {
      deleted: deleted_objects,
      updated: updated_objects,
    }
  }
}
