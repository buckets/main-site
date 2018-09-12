import * as moment from 'moment-timezone'
import { IObject, IStore } from '../store';
import { INotable } from './notes';
import { ensureLocalMoment, parseLocalTime, localNow, ts2localdb, Interval, parseUTCTime } from '../time'
import { rankBetween } from '../ranking'
import { computeBalances, Balances } from './balances'
import { DEFAULT_COLORS } from '../color'

//-------------------------------------------------------
// Database objects
//-------------------------------------------------------
declare module '../store' {
  interface IObjectTypes {
    bucket: Bucket;
    bucket_group: Group;
    bucket_transaction: Transaction;
  }
  interface ISubStore {
    buckets: BucketStore;
  }
}
export type BucketKind =
  ''
  | 'deposit'
  | 'goal-deposit'
  | 'goal-date'
  | 'deposit-date';

export interface Bucket extends IObject,INotable {
  _type:'bucket';
  name: string;
  balance: number;
  kicked: boolean;
  group_id: number;
  ranking: string;
  color: string;

  kind: BucketKind;
  goal: number;
  end_date: string;
  deposit: number;
  notes: string;
  debt_account_id: number;
}
export interface Transaction extends IObject,INotable {
  _type: 'bucket_transaction';
  bucket_id: number;
  
  amount: number;
  memo: string;
  posted: string;
  account_trans_id: number;
  transfer: boolean;
  notes: string;
  linked_trans_id: number;
}
export interface Group extends IObject,INotable {
  _type: 'bucket_group';
  name: string;
  ranking: string;
  notes: string;
}
//-------------------------------------------------------


export interface BucketFlow {
  rain_in: number;
  nonrain_in: number;
  out: number;
  total_activity: number;
}
export const emptyFlow:BucketFlow = {
  rain_in: 0,
  nonrain_in: 0,
  out: 0,
  total_activity: 0,
}
export interface BucketFlowMap {
  [bucket_id: number]: BucketFlow;
}

export class BucketStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  /**
   *  Create a new bucket
   */
  async add(args?:{name:string, group_id?:number, debt_account_id?:number}):Promise<Bucket> {
    let data:Partial<Bucket> = args || {};
    let group_id = args.group_id || null;
    let rows = await this.store.query<{highrank:string}>(`
        SELECT max(ranking) as highrank
        FROM bucket
        WHERE coalesce(group_id, -1) = coalesce($group_id, -1)`, {
          $group_id: group_id,
        })
    data.ranking = rankBetween(rows[0].highrank, 'z')
    data.color = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
    if (args.debt_account_id !== undefined) {
      data.debt_account_id = args.debt_account_id;
    }
    return this.store.createObject('bucket', data);
  }
  async list():Promise<Bucket[]> {
    return this.store.listObjects('bucket', {
      order: ['name ASC', 'id'],
    })
  }
  async get(bucket_id:number):Promise<Bucket> {
    return this.store.getObject('bucket', bucket_id);
  }
  async update(bucket_id:number, data:Partial<Bucket>):Promise<Bucket> {
    return this.store.updateObject('bucket', bucket_id, data);
  }
  async kick(bucket_id:number):Promise<Bucket> {
    let transactions = await this.store.query(
      `SELECT id
      FROM bucket_transaction
      WHERE
        bucket_id=$bucket_id
      LIMIT 1`,
      {$bucket_id: bucket_id})
    if (transactions.length) {
      // bucket has been used
      return this.update(bucket_id, {kicked: true});
    } else {
      // bucket is unused
      return this.deleteBucket(bucket_id);
    }
  }
  async unkick(bucket_id:number):Promise<Bucket> {
    return this.update(bucket_id, {kicked: false});
  }
  async deleteBucket(bucket_id:number) {
    // Delete bucket transactions
    let btrans_ids = (await this.store.query<{id:number}>(`SELECT id FROM bucket_transaction WHERE bucket_id=$id;`, {$id: bucket_id}))
      .map(x=>x.id);
    await this.deleteTransactions(btrans_ids)

    let old_bucket = await this.get(bucket_id);
    await this.store.deleteObject('bucket', bucket_id);
    return old_bucket;
  }
  async earliestTransaction(bucket_id:number):Promise<moment.Moment> {
    let rows = await this.store.query<{d:string}>(`
      SELECT min(posted) as d FROM bucket_transaction
      WHERE bucket_id=$bucket_id`, {
        $bucket_id: bucket_id,
      });
    if (!rows.length) {
      rows = await this.store.query<{d:string}>(`
        SELECT created as d FROM bucket
        WHERE id=$bucket_id`, {
          $bucket_id: bucket_id,
        });
    }
    return parseUTCTime(rows[0].d);
  }
  /**
   *
   */
  async countTransactions(bucket_id:number, interval:Interval, where?:string):Promise<number> {
    if (where) {
      where = `AND ${where}`;
    }
    let rows = await this.store.query(`
      SELECT
        count(*)
      FROM bucket_transaction
      WHERE
        bucket_id = $bucket_id
        AND posted >= $start
        AND posted < $end
        ${where}`, {
          $bucket_id: bucket_id,
          $start: ts2localdb(interval.start),
          $end: ts2localdb(interval.end),
        });
    if (rows.length) {
      // No transactions within this 
      return rows[0][0]
    } else {
      return 0;
    }
  }

  async transact(args:{
    bucket_id: number,
    amount: number,
    memo?: string,
    posted?: moment.Moment,
    account_trans_id?: number,
    transfer?: boolean,
  }):Promise<Transaction> {
    if (!args.amount) {
      return null;
    }
    let data:any = {
      bucket_id: args.bucket_id,
      amount: args.amount || 0,
      memo: args.memo || '',
      account_trans_id: args.account_trans_id || null,
      transfer: args.transfer || false,
    };
    if (args.posted) {
      data.posted = ts2localdb(args.posted)
    }
    if (args.bucket_id === null) {
      throw new Error('You must provide a bucket');
    }
    let trans = await this.store.createObject('bucket_transaction', data);
    let bucket = await this.store.getObject('bucket', args.bucket_id);
    this.store.publishObject('update', bucket);
    return trans;
  }
  async deleteTransactions(trans_ids:number[]) {
    let affected_buckets = new Set();
    let affected_atrans = new Set();

    // This could be optimized later
    await Promise.all(trans_ids.map(async (transid) => {
      let trans = await this.store.getObject('bucket_transaction', transid);
      affected_buckets.add(trans.bucket_id)
      if (trans.account_trans_id) {
        affected_atrans.add(trans.account_trans_id)
      }
      await this.store.deleteObject('bucket_transaction', transid);
    }));
    await Promise.all(Array.from(affected_buckets).map(async (bucket_id) => {
      let bucket = await this.store.getObject('bucket', bucket_id);
      this.store.publishObject('update', bucket);
    }));
    await Promise.all(Array.from(affected_atrans).map(async (atrans_id) => {
      await this.store.sub.accounts.removeCategorization(atrans_id, false);
    }))
  }
  async updateTransaction(transid:number, data:Partial<Transaction>):Promise<Transaction> {
    let trans = await this.store.getObject('bucket_transaction', transid);
    let affected_bucket_id = trans.bucket_id;
    let new_trans = await this.store.updateObject('bucket_transaction', transid, data);
    let new_bucket = await this.store.getObject('bucket', affected_bucket_id);
    this.store.publishObject('update', new_trans);
    this.store.publishObject('update', new_bucket);
    return new_trans;
  }

  async balances(asof?:moment.Moment, bucket_id?:number):Promise<Balances> {
    let where = 'a.kicked <> 1'
    let params = {};
    if (bucket_id !== undefined) {
      where += ' AND a.id = $bucket_id'
      params = {$bucket_id: bucket_id}
    }
    return computeBalances(this.store,
      'bucket', 'bucket_transaction', 'bucket_id',
      asof, where, params)
  }

  async combinedRainfall(args:{
    onOrAfter?:moment.Moment,
    before?:moment.Moment,
  }={}):Promise<number> {
    let wheres = [
      'account_trans_id IS NULL',
      'b.kicked <> 1',
    ];
    let params:any = {};
    if (args.onOrAfter) {
      wheres.push('posted >= $onOrAfter')
      params.$onOrAfter = ts2localdb(args.onOrAfter);
    }
    if (args.before) {
      wheres.push('posted < $before')
      params.$before = ts2localdb(args.before);
    }
    const qry = `
      SELECT
        sum(amount) AS rainfall
      FROM
        bucket_transaction AS t
        LEFT JOIN bucket AS b
          ON t.bucket_id = b.id
      WHERE
        ${wheres.join(' AND ')}
    `;
    let rows = await this.store.query<{rainfall:number}>(qry, params)
    if (rows.length) {
      return rows[0].rainfall || 0
    } else {
      return 0;
    }
  }

  async getFlow(onOrAfter:moment.Moment, before:moment.Moment):Promise<BucketFlowMap> {
   let rows = await this.store.query<{rain_in:number,nonrain_in:number,amount_out:number,bucket_id:number}>(`
        SELECT
          SUM(CASE
              WHEN
                  amount >= 0
                  AND account_trans_id IS NULL
              THEN amount
              ELSE 0
              END) as rain_in,
          SUM(CASE
              WHEN
                  amount >= 0
                  AND account_trans_id IS NOT NULL
              THEN amount
              ELSE 0
              END) as nonrain_in,
          SUM(CASE
              WHEN
                  amount < 0
              THEN amount
              ELSE 0
              END) as amount_out,
          bucket_id
      FROM
          bucket_transaction
      WHERE
        posted >= $onOrAfter
        AND posted < $before
      GROUP BY
        bucket_id
      `, {
        $onOrAfter: ts2localdb(onOrAfter),
        $before: ts2localdb(before),
      })
    let ret:BucketFlowMap = {};
    rows.forEach(row => {
      ret[row.bucket_id] = {
        rain_in: row.rain_in,
        out: row.amount_out,
        nonrain_in: row.nonrain_in,
        total_activity: row.amount_out + row.nonrain_in
      }
    })
    return ret; 
  }

  async listTransactions(args:{
    bucket_id?: number,
    account_trans_id?: number,
    posted?:{
      onOrAfter?:moment.Moment,
      before?:moment.Moment,
    },
    limit?: number;
    offset?: number;
    where?: string;
  }):Promise<Transaction[]> {
    let where_parts:string[] = [];
    let params:any = {};

    if (args) {
      // bucket
      if (args.bucket_id !== undefined) {
        where_parts.push('bucket_id = $bucket_id');
        params['$bucket_id'] = args.bucket_id;
      }

      // account trans
      if (args.account_trans_id !== undefined) {
        where_parts.push('account_trans_id = $account_trans_id');
        params.$account_trans_id = args.account_trans_id;
      }

      // posted range
      if (args.posted) {
        if (args.posted.onOrAfter) {
          where_parts.push('posted >= $onOrAfter');
          params['$onOrAfter'] = ts2localdb(args.posted.onOrAfter);
        }
        if (args.posted.before) {
          where_parts.push('posted < $before');
          params['$before'] = ts2localdb(args.posted.before);
        }
      }

      // where
      if (args.where) {
        where_parts.push(args.where);
      }
    }

    let where = where_parts.join(' AND ');
    return this.store.listObjects('bucket_transaction', {
      where,
      params,
      order: ['posted DESC', 'id DESC'],
      limit: args.limit,
      offset: args.offset,
    });
  }
  async moveBucket(moving_id:number, placement:'before'|'after', reference_id:number):Promise<Bucket> {
    let where;
    let order;
    if (placement === 'before') {
      // before
      where = 'ranking <= (SELECT ranking FROM bucket WHERE id=$reference_id)'
      order = 'ranking DESC'
    } else {
      // after
      where = 'ranking >= (SELECT ranking FROM bucket WHERE id=$reference_id)'
      order = 'ranking ASC'
    }
    let rows = await this.store.query<{id:number,ranking:string,group_id:number}>(`
        SELECT id, ranking, group_id
        FROM bucket
        WHERE
          coalesce(group_id, -1) = coalesce(
            (SELECT group_id FROM bucket WHERE id=$reference_id), -1)
          AND ${where}
        ORDER BY ${order}
        LIMIT 2
        `, {
          $reference_id: reference_id,
        })
    let ranking;
    let group_id;
    if (rows.length === 0) {
      throw new Error(`No such reference bucket: ${reference_id}`);
    } else if (rows.length === 1) {
      group_id = rows[0].group_id;
      if (placement === 'before') {
        ranking = rankBetween(null, rows[0].ranking);
      } else if (placement === 'after') {
        ranking = rankBetween(rows[0].ranking, null);
      }
    } else {
      // 2 rows
      group_id = rows[0].group_id;
      ranking = rankBetween(rows[0].ranking, rows[1].ranking);
    }
    return this.update(moving_id, {ranking, group_id})
  }

  //-------------------------------------------------------------
  // Group stuff
  //-------------------------------------------------------------
  async addGroup(args:{name: string}):Promise<Group> {
    let data:Partial<Group> = args || {};
    let rows = await this.store.query<{highrank:string}>(`
      SELECT max(ranking) as highrank
      FROM bucket_group`, {})
    data.ranking = rankBetween(rows[0].highrank, 'z')
    return this.store.createObject('bucket_group', data);
  }
  async listGroups():Promise<Group[]> {
    return this.store.listObjects('bucket_group', {
      order: ['ranking', 'name', 'id'],
    })
  }
  async getGroup(id:number):Promise<Group> {
    return this.store.getObject('bucket_group', id);
  }
  async updateGroup(id:number, data:{name?:string, ranking?:string}):Promise<Group> {
    return this.store.updateObject('bucket_group', id, data);
  }
  async deleteGroup(id:number):Promise<any> {
    const maxrank_rows = await this.store.query<{maxrank:string}>(`
      SELECT
        max(ranking) as maxrank
      FROM bucket
      WHERE coalesce(group_id, -1) = -1`, {})
    let max_rank = maxrank_rows[0].maxrank;

    const ranking_rows = await this.store.query<{id:number,ranking:string}>(`
        SELECT
          id,
          ranking
        FROM bucket
        WHERE coalesce(group_id, -1) = coalesce($group_id, -1)
        ORDER BY ranking`, {
          $group_id: id,
        })
    for (const row of ranking_rows) {
      let new_rank = max_rank = rankBetween(max_rank, 'z');
      await this.update(row.id, {ranking: new_rank, group_id: null})
    }
    return this.store.deleteObject('bucket_group', id);
  }
  async moveGroup(moving_id:number, placement:'before'|'after', reference_id:number) {
    let where;
    let order;
    if (placement === 'before') {
      // before
      where = 'ranking <= (SELECT ranking FROM bucket_group WHERE id=$reference_id)'
      order = 'ranking DESC'
    } else {
      // after
      where = 'ranking >= (SELECT ranking FROM bucket_group WHERE id=$reference_id)'
      order = 'ranking ASC'
    }
    let rows = await this.store.query<{id:number,ranking:string}>(`
        SELECT id, ranking
        FROM bucket_group
        WHERE ${where}
        ORDER BY ${order}
        LIMIT 2
        `, {
          $reference_id: reference_id,
        })
    let ranking;
    if (rows.length === 0) {
      throw new Error(`No such reference group: ${reference_id}`);
    } else if (rows.length === 1) {
      if (placement === 'before') {
        ranking = rankBetween(null, rows[0].ranking);
      } else if (placement === 'after') {
        ranking = rankBetween(rows[0].ranking, null);
      }
    } else {
      // 2 rows
      ranking = rankBetween(rows[0].ranking, rows[1].ranking);
    }
    return this.updateGroup(moving_id, {ranking})
  }
}

//----------------------------------------------------------------
// Deposits, goals, etc...
//----------------------------------------------------------------
export interface ComputeArgs {
  today: moment.Moment;
  balance: number;
}
export interface IComputedData {
  deposit: number;
  goal: number;
  end_date: moment.Moment;
}

/**
 *  Compute the amount a bucket wants (and other information)
 **/
export function computeBucketData(kind:BucketKind, b:Bucket, args?:ComputeArgs):IComputedData;
export function computeBucketData(kind:'', b:Bucket):IComputedData;
export function computeBucketData(kind:'deposit', b:Bucket):IComputedData;
export function computeBucketData(kind:'goal-deposit'|'goal-date'|'deposit-date', b:Bucket, args:ComputeArgs):IComputedData;
export function computeBucketData(kind:BucketKind, b:Bucket, args?:ComputeArgs):IComputedData {
  let ret = {
    deposit: 0,
    goal: 0,
    end_date: null,
  };
  let today, balance;
  if (args) {
    today = args.today !== null ? args.today : localNow();
    balance = args.balance !== null ? args.balance : b.balance;
  }
  switch (b.kind) {
    case 'deposit': {
      ret.deposit = b.deposit;
      break;
    }
    case 'goal-deposit': {
      const deposit = balance + b.deposit > b.goal
        ? b.goal - balance : b.deposit;
      Object.assign(ret, {
        goal: b.goal,
        deposit,
        end_date: computeGoalEndDate(balance, b.goal, b.deposit, today),
      })
      break;
    }
    case 'goal-date': {
      Object.assign(ret, {
        goal: b.goal,
        deposit: computeGoalDeposit(balance, b.goal, parseLocalTime(b.end_date), today),
        end_date: parseLocalTime(b.end_date),
      })
      break;
    }
    case 'deposit-date': {
      Object.assign(ret, {
        goal: computeGoal(balance, b.deposit, parseLocalTime(b.end_date), today),
        deposit: b.deposit,
        end_date: parseLocalTime(b.end_date),
      })
      break;
    }
    default: {
      Object.assign(ret, {
        goal: 0,
        deposit: 0,
        end_date: null,
      })
    }
  }
  return ret;
}

function computeGoalEndDate(balance:number, goal:number, deposit:number, today:moment.Moment):moment.Moment {
  if (!deposit) {
    return null;
  }
  let units = Math.ceil((goal - balance) / deposit);
  let dt = ensureLocalMoment(today);
  return dt.add(units, 'month').startOf('month');
}
function computeGoalDeposit(balance:number, goal:number, end_date:moment.Moment, today:moment.Moment):number {
  let s = ensureLocalMoment(today);
  let e = ensureLocalMoment(end_date);
  let diff = e.diff(s, 'month') + 1;
  let left = goal - balance;
  left = left <= 0 ? 0 : left;
  if (diff > 0) {
    // there's time
    return Math.ceil(left / diff)
  } else {
    // no time left
    return left;
  }
}
function computeGoal(balance:number, deposit:number, end_date:moment.Moment, today:moment.Moment):number {
  let s = ensureLocalMoment(today);
  let e = ensureLocalMoment(end_date);
  let diff = e.diff(s, 'month') + 1;
  if (diff > 0) {
    // there's time
    return balance + (diff * deposit);
  } else {
    // no time left
    return balance;
  }
}
