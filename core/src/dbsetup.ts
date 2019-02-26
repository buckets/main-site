import { sss } from '@iffycan/i18n'
import { CustomError } from './errors'
import { NotFound, SQLiteStore } from './dbstore'
import { IStore } from './store'
import { PrefixLogger } from './logging'
import { rankBetween } from './ranking'

const log = new PrefixLogger('(dbsetup)')

export class NewerSchemaError extends CustomError {}


/**
 *  Call this right after you open a database to make sure
 *  it's set up:
 *
 *  - Upgrades database schema
 *  - Enables triggers
 *  - Adds Buckets License bucket if asked
 *  - Starts undo/redo tracking
 */
export async function setupDatabase(store:SQLiteStore, opts:{
  addBucketsLicenseBucket?: boolean;
  noUndo?: boolean;
  openNewerSchemas?: boolean;
}={}) {
  // ensure triggers are enabled
  try {
    await store.query('DELETE FROM x_trigger_disabled', {})
  } catch(err) {
    log.error('Error enabling triggers');
    log.error(err.stack);
    throw err;
  }

  if (opts.addBucketsLicenseBucket) {
    try {
      await ensureBucketsLicenseBucket(store);  
    } catch(err) {
      log.error('Error adding buckets license bucket');
      log.error(err.stack);
    }
  }
  
  if (!opts.noUndo) {
    // track undos
    await store.undo.start();  
  }
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
        name: sss('Buckets License'/* 'Buckets' refers to the application name */),
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
    name: sss('Buckets License'/* 'Buckets' refers to the application name */),
    ranking: ranking,
    color: 'rgba(52, 152, 219,1.0)',
    group_id: group_id,
  })
}

