import { IObjectTypes } from './store'
import { SQLiteStore } from './dbstore'
import { PrefixLogger } from './logging'
import { EventSource } from '@iffycan/events'

const log = new PrefixLogger('(undo)')


export interface SQLiteTableInfoRow {
  cid: number;
  name: string;
  type: 'INTEGER'|'TIMESTAMP'|'TEXT'|'TINYINT';
  notnull?: number;
  pk?: number;
  dflt_value?: string;
}

export type DirectionType =
  | 'undo'
  | 'redo'

export interface ICheckpoint {
  id: number;
  created: string;
  undo_log_id: number;
  direction: DirectionType;
  label: string;
}
export interface ILogEntry {
  id: number;
  table_name: string;
  object_id: number;
  direction: DirectionType;
  sql: string;
}

export interface IChange {
  table: keyof IObjectTypes;
  id: number;
  change: 'update'|'delete';
}
export interface UndoRedoResult {
  changes: IChange[];
}

/**
 *  Utility class to add undo functionality to an SQLiteStore.
 */
export class UndoTracker {

  // milliseconds window that groups actions together
  private checkpoint_id:number = null;
  private direction:DirectionType = 'undo';

  private _nextUndoLabel:string = null;
  private _nextRedoLabel:string = null;

  readonly events = {
    stackchange: new EventSource<DirectionType>(),
  }

  constructor(private store:SQLiteStore) {

  }
  async start() {
    console.log("UndoTracker.start");
    const init_sqls = [
      `CREATE TEMP TABLE undo_status (
        direction TEXT,
        temporary TINYINT DEFAULT 0
      )`,
      `INSERT INTO undo_status (direction) values ('undo')`,

      `CREATE TEMP TABLE undo_checkpoint (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        undo_log_id INTEGER,
        direction TEXT,
        label TEXT
      )`,
      
      `CREATE TEMP TABLE undo_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        object_id INTEGER,
        direction TEXT,
        sql TEXT
      )`,

      `CREATE TEMP TRIGGER wipe_redos
      AFTER INSERT ON undo_checkpoint
      WHEN
        NEW.direction = 'undo'
        AND (SELECT temporary FROM undo_status) = 0
      BEGIN
        DELETE FROM undo_checkpoint WHERE direction='redo';
        DELETE FROM undo_log WHERE direction='redo';
      END`,
    ];
    try {
      await this.store.executeMany(init_sqls);  
    } catch(err) {
      log.error('Error setting up undo_log', init_sqls);
      log.error(err.stack)
      throw err;
    }

    console.log("Decide which tables Don't have UNDO");
    // Decide which tables DON'T get undo tracking
    const exclude_tables = new Set([
      '_schema_version',
      '_dear_hacker',
      'x_trigger_disabled',
    ])
    console.log("get all tables");
    const all_tables = await this.store.query<{name:string}>(`SELECT name FROM sqlite_master WHERE type='table'`, {});
    console.log("Got all tables", all_tables);
    const sqls = await Promise.all(all_tables
    .map(x => x.name)
    .filter(table_name => !exclude_tables.has(table_name))
    .map(table_name => this.enableTableSQL(table_name)))

    console.log("Gonna execute sqls", sqls.length);
    try {
      await this.store.db.executeMany(sqls)
    } catch(err) {
      log.error('Error enabling undo tracking')
      log.info(sqls)
      throw err;
    }
  }

  get nextUndoLabel() {
    return this._nextUndoLabel;
  }
  get nextRedoLabel() {
    return this._nextRedoLabel;
  }

  async logState() {
    let undo_log:ILogEntry[] = await this.store.query<ILogEntry>('SELECT * FROM undo_log', {});
    let checkpoints:ICheckpoint[] = await this.store.query<ICheckpoint>('SELECT * FROM undo_checkpoint', {});
    log.info('undo_log\n' + undo_log.map(item => {
      return `${item.id} ${item.direction}: ${item.sql}`;
    }).join('\n'));
    
    log.info('undo_checkpoint\n' + checkpoints.map(item => {
      return `${item.id} ${item.direction}: "${item.label}" ${item.undo_log_id}`;
    }).join('\n'))
  }
  async enableTableSQL(table_name:string) {
    console.log("enableTableSQL", table_name);
    const columns = Array.from(await this.store.query<SQLiteTableInfoRow>(`pragma table_info(${table_name})`, {}));

    console.log("columns", columns);

    return `
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

  async popStack(direction:DirectionType):Promise<UndoRedoResult> {
    let rows = await this.store.query<ICheckpoint>(`SELECT * FROM undo_checkpoint WHERE direction=$direction ORDER BY id DESC LIMIT 1`, {$direction: direction});
    const checkpoint = rows[0];
    if (!checkpoint) {
      // stack is empty
      return {
        changes: [],
      };
    }

    const logitems = await this.store.query<ILogEntry>(`
      SELECT id, table_name, object_id, sql
      FROM undo_log
      WHERE
        direction = $direction
        AND id > $undo_log_id
      ORDER BY id DESC
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
    
    let object_map:{
      [key:string]: IChange
    } = {};
    let ret:UndoRedoResult = {
      changes: [],
    }

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
        const key = `${item.table_name} ${item.object_id}`;
        const existing_change = object_map[key]
        if (existing_change) {
          // A prior change is going to be overwritten
          ret.changes.splice(ret.changes.indexOf(existing_change), 1)
        }
        const change:IChange = {
          table: item.table_name as keyof IObjectTypes,
          id: item.object_id,
          change: (item.sql.startsWith('DELETE') ? 'delete' : 'update'),
        }
        ret.changes.push(change)
        object_map[key] = change;
      }

      // Enable triggers
      sqls.push(`DELETE FROM x_trigger_disabled`);

      // Remove checkpoint
      sqls.push(`DELETE FROM undo_checkpoint WHERE id = ${checkpoint.id}`)

      await this.store.executeMany(sqls);
    })

    // Switch back to undo mode, which is the default mode
    await this.store.query(
      `UPDATE undo_status
       SET
         direction = 'undo',
         temporary = 0`, {});
    this.direction = 'undo'

    // notify about stack change
    const label_rows = await this.store.query<{direction:DirectionType,label:string}>(`
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

    return ret;
  }
}
