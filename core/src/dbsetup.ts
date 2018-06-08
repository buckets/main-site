import * as Path from 'path'
import * as fs from 'fs-extra-promise'
import { sss } from '@iffycan/i18n'
import { IAsyncSqlite, NotFound, SQLiteStore } from './dbstore'
import { IStore } from './store'
import { PrefixLogger } from './logging'
import { Migration, migrations as jsmigrations } from './models/jsmigrations'
import { rankBetween } from './ranking'

const log = new PrefixLogger('(dbsetup)')


/**
 *  Call this right after you open a database to make sure
 *  it's set up:
 *
 *  - Upgrades database schema
 *  - Enables triggers
 *  - Adds Buckets License bucket if asked
 *  - Starts undo/redo tracking
 */
export async function setupDatabase(store:SQLiteStore, addBucketsLicenseBucket=false) {
  const migrations_dir = Path.join(require.resolve('buckets-core'), '../../migrations');

  // upgrade database
  try {
    log.info('Doing database migrations');
    await upgradeDatabase(store.db, migrations_dir, jsmigrations);
  } catch(err) {
    log.error('Error during database migrations');
    log.error(err.stack);
    throw err;
  }

  // ensure triggers are enabled
  try {
    await store.query('DELETE FROM x_trigger_disabled', {})
  } catch(err) {
    log.error('Error enabling triggers');
    log.error(err.stack);
    throw err;
  }

  if (addBucketsLicenseBucket) {
    try {
      await ensureBucketsLicenseBucket(store);  
    } catch(err) {
      log.error('Error adding buckets license bucket');
      log.error(err.stack);
    }
  }
  
  // track undos
  await store.undo.start();
}

/**
 *  Add the Buckets License bucket to a budget.
 *
 *  DO NOT CALL this if the user has a registered version of
 *  the application.
 */
async function ensureBucketsLicenseBucket(store:IStore) {
  let license_bucket;
  try {
    license_bucket = await store.sub.buckets.get(-1);  
  } catch(e) {
    if (e instanceof NotFound) {
      license_bucket = await store.sub.buckets.add({
        name: sss('Buckets License'),
      })
      await store.query('UPDATE bucket SET id=-1 WHERE id=$id', {
        $id: license_bucket.id
      })
    } else {
      throw e;
    }
  }
  let groups = await store.sub.buckets.listGroups();
  let group_id = null;
  if (groups.length) {
    group_id = groups[0].id;
  }
  let rows = await store.query<{id:number, ranking:string}>(`
    SELECT id, ranking
    FROM bucket
    WHERE group_id=$group_id
    ORDER BY ranking
    LIMIT 1
    `, {$group_id: group_id});
  let ranking = 'b';
  if (rows.length) {
    let first_bucket = rows[0];
    if (first_bucket.id !== -1) {
      // There's a bucket in front
      ranking = rankBetween('a', first_bucket.ranking);
    }
  }
  await store.sub.buckets.update(-1, {
    kind: 'goal-deposit',
    goal: license_bucket.goal <= 100 ? 2900 : license_bucket.goal,
    deposit: license_bucket.deposit <= 100 ? 500 : license_bucket.deposit,
    kicked: false,
    name: sss('Buckets License'),
    ranking: ranking,
    color: 'rgba(52, 152, 219,1.0)',
    group_id: group_id,
  })
}

/**
 *  Apply database schema patches
 */
async function upgradeDatabase(db:IAsyncSqlite, migrations_path:string, js_migrations:Migration[]):Promise<any> {

  let logger = new PrefixLogger('(dbup)');
  await db.run(`CREATE TABLE IF NOT EXISTS _schema_version (
  id INTEGER PRIMARY KEY,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name TEXT UNIQUE
)`)

  //--------------------------------------------------------
  // old style of migrations
  let old_migrations = [];
  try {
    old_migrations = await db.all('SELECT id,name FROM migrations');
    logger.info('Old migrations present');
  } catch(err) {
  }
  if (old_migrations.length) {
    logger.info('Switching to new migrations method');
    // old style of migrations
    for (const row of old_migrations) {
      const name = `000${row.id}-${row.name}`.toLowerCase();
      logger.info('Inserting', name);
      await db.run(`INSERT INTO _schema_version (name) VALUES ($name)`, {$name: name})
    }
    logger.info('Dropping migrations');
    await db.run('DROP TABLE migrations')
  }
  // end old style of migrations
  //--------------------------------------------------------

  const applied = new Set<string>((await db.all<any>('SELECT name FROM _schema_version')).map(x => x.name));
  logger.info('Applied migrations:', Array.from(applied).join(', '))

  // collect all migrations (first js)
  let all_migrations:Migration[] = [...js_migrations];

  // collect file-based migrations
  const migrations = await new Promise<string[]>((resolve, reject) => {
    fs.readdir(migrations_path, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    })
  })
  for (const path of migrations) {
    const fullname = path.split('.')[0].toLowerCase();
    const order = Number(fullname.split('-')[0]);
    const name = fullname.split('-').slice(1).join('-');

    const fullpath = Path.resolve(migrations_path, path);
    const fullsql = await new Promise<string>((resolve, reject) => {
      fs.readFile(fullpath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.toString());
        }
      });
    });
    all_migrations.push({
      order,
      name,
      func: (db) => {
        return db.exec(fullsql);
      },
    })
  }

  // Check for duplicate patch names/orders
  let encountered_names = new Set<string>();
  let encountered_orders = new Set<number>();
  all_migrations.forEach(mig => {
    if (encountered_names.has(mig.name)) {
      throw new Error(`Duplicate schema patch name not allowed: ${mig.name} (${mig.order}) <${Array.from(encountered_names).join(',')}>`);
    }
    if (encountered_orders.has(mig.order)) {
      throw new Error(`Duplicate schema order not allowed: ${mig.order} ${Array.from(encountered_orders)}`);
    }
    encountered_names.add(mig.name);
    encountered_orders.add(mig.order);
  })

  // Sort by order
  all_migrations.sort((a,b) => {
    if (a.order < b.order) {
      return -1
    } else if (a.order > b.order) {
      return 1
    } else {
      return 0
    }
  })

  // Apply patches
  for (const migration of all_migrations) {
    const name = migration.name;
    const padded = `0000${migration.order}`.slice(-4);
    const fullname = `${padded}-${migration.name}`
    const plog = logger.child(`(patch ${fullname})`)
    if (applied.has(fullname)) {
      // already applied
    } else {
      plog.info('applying...');
      try {
        await db.run('BEGIN EXCLUSIVE TRANSACTION');
        await migration.func(db);
        await db.run(`INSERT INTO _schema_version (name) VALUES ($name)`, {$name: fullname});
        await db.run('COMMIT TRANSACTION');
        plog.info('commit');
      } catch(err) {
        plog.error('Error while running patch');
        plog.warn(err);
        await db.run('ROLLBACK');

        // hold over from prior flakey migrations
        if (migration.order <= 7 && (
            err.toString().indexOf('duplicate column name') !== -1
            || err.toString().indexOf('already exists') !== -1
          )) {
          // we'll pretend it succeeded
          await db.run(`INSERT INTO _schema_version (name) VALUES ($name)`, {$name: name});
          plog.warn(err.toString());
          plog.info('Assuming patch was already applied');
        } else {
          // legitimate error
          throw err;
        }
      }
      plog.info('applied.');
    }
  }
  logger.info('schema is in sync');

  // logger.info('schema list:')
  // let sqlite_master = await db.all('SELECT * FROM sqlite_master');
  // sqlite_master.forEach(item => {
  //   logger.info(`${item.type} ${item.name}`);
  // })
}