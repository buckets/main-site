import * as moment from 'moment'
import { IObject, IStore, registerClass } from '../store'
import { ensureLocalMoment, ts2db, Timestamp } from '../time'
import { Balances, computeBalances } from './balances'
import { rankBetween } from '../ranking'
import { DEFAULT_COLORS } from '../color'

export type BucketKind =
  ''
  | 'deposit'
  | 'goal-deposit'
  | 'goal-date'
  | 'deposit-date';

export class Bucket implements IObject {
  static table_name: string = 'bucket';
  id: number;
  created: string;
  readonly _type: string = Bucket.table_name;
  name: string;
  notes: string;
  balance: number = 0;
  kicked: boolean;
  group_id: number;
  ranking: string;
  color: string;

  kind: BucketKind = '';
  goal: number;
  end_date: string;
  deposit: number;

  static fromdb(obj:Bucket) {
    // convert to boolean
    obj.kicked = !!obj.kicked;
    return obj;
  }
}
registerClass(Bucket);

export class Transaction implements IObject {
  static table_name: string = 'bucket_transaction';
  id: number;
  created: string;
  readonly _type: string = Transaction.table_name;
  bucket_id: number;
  
  amount: number;
  memo: string;
  posted: string;
  account_trans_id: number;
  transfer: boolean;

  static fromdb(obj:Transaction) {
    // convert to boolean
    obj.transfer = !!obj.transfer;
    return obj;
  }
}
registerClass(Transaction);

export class Group implements IObject {
  static table_name: string = 'bucket_group';
  id: number;
  created: string;
  readonly _type: string = Group.table_name;
  name: string;
  ranking: string;
}
registerClass(Group);


export class BucketStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async add(args?:{name:string, group_id?:number}):Promise<Bucket> {
    let data:Partial<Bucket> = args || {};
    let group_id = args.group_id || null;
    let rows = await this.store.query(`
        SELECT max(ranking) as highrank
        FROM bucket
        WHERE coalesce(group_id, -1) = coalesce($group_id, -1)`, {
          $group_id: group_id,
        })
    data.ranking = rankBetween(rows[0].highrank, 'z')
    data.color = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
    return this.store.createObject(Bucket, data);
  }
  async list():Promise<Bucket[]> {
    return this.store.listObjects(Bucket, {
      order: ['name ASC', 'id'],
    })
  }
  async get(bucket_id:number):Promise<Bucket> {
    return this.store.getObject(Bucket, bucket_id);
  }
  async update(bucket_id:number, data:Partial<Bucket>):Promise<Bucket> {
    return this.store.updateObject(Bucket, bucket_id, data);
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
      let old_bucket = await this.get(bucket_id);
      await this.store.deleteObject(Bucket, bucket_id);
      return old_bucket;
    }
  }
  async unkick(bucket_id:number):Promise<Bucket> {
    return this.update(bucket_id, {kicked: false});
  }

  async transact(args:{
    bucket_id: number,
    amount: number,
    memo?: string,
    posted?: Timestamp,
    account_trans_id?: number,
    transfer?: boolean,
  }):Promise<Transaction> {
    let data:any = {
      bucket_id: args.bucket_id,
      amount: args.amount,
      memo: args.memo || '',
      account_trans_id: args.account_trans_id || null,
      transfer: args.transfer || false,
    };
    if (args.posted) {
      data.posted = ts2db(args.posted)
    }
    if (args.bucket_id === null) {
      throw new Error('You must provide a bucket');
    }
    let trans = await this.store.createObject(Transaction, data);
    let bucket = await this.store.getObject(Bucket, args.bucket_id);
    this.store.publishObject('update', bucket);
    return trans;
  }
  async deleteTransactions(trans_ids:number[]) {
    let affected_buckets = new Set();

    // This could be optimized later
    await Promise.all(trans_ids.map(async (transid) => {
      let trans = await this.store.getObject(Transaction, transid);
      affected_buckets.add(trans.bucket_id)
      await this.store.deleteObject(Transaction, transid);
    }));
    await Promise.all(Array.from(affected_buckets).map(async (bucket_id) => {
      let account = await this.store.getObject(Bucket, bucket_id);
      this.store.publishObject('update', account);
    }));
  }

  async balances(asof?:Timestamp):Promise<Balances> {
    return computeBalances(this.store,
      'bucket', 'bucket_transaction', 'bucket_id',
      asof, 'a.kicked <> 1')
  }
  async listTransactions(args:{
    bucket_id?: number,
    account_trans_id?: number,
    posted?:{
      onOrAfter?:Timestamp,
      before?:Timestamp,
    },
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
          params['$onOrAfter'] = ts2db(args.posted.onOrAfter);
        }
        if (args.posted.before) {
          where_parts.push('posted < $before');
          params['$before'] = ts2db(args.posted.before);
        }
      }
    }

    let where = where_parts.join(' AND ');
    return this.store.listObjects(Transaction, {where, params,
      order: ['posted DESC', 'id']});
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
    let rows = await this.store.query(`
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
    let rows = await this.store.query(`
      SELECT max(ranking) as highrank
      FROM bucket_group`, {})
    data.ranking = rankBetween(rows[0].highrank, 'z')
    return this.store.createObject(Group, data);
  }
  async listGroups():Promise<Group[]> {
    return this.store.listObjects(Group, {
      order: ['ranking', 'name', 'id'],
    })
  }
  async getGroup(id:number):Promise<Group> {
    return this.store.getObject(Group, id);
  }
  async updateGroup(id:number, data:{name?:string, ranking?:string}):Promise<Group> {
    return this.store.updateObject(Group, id, data);
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
    let rows = await this.store.query(`
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
interface ComputeArgs {
  today: Timestamp;
  balance: number;
}
export function computeBucketData(kind:BucketKind, b:Bucket, args?:ComputeArgs);
export function computeBucketData(kind:'', b:Bucket);
export function computeBucketData(kind:'deposit', b:Bucket);
export function computeBucketData(kind:'goal-deposit'|'goal-date'|'deposit-date', b:Bucket, args:ComputeArgs);
export function computeBucketData(kind:BucketKind, b:Bucket, args?:ComputeArgs):{
  deposit: number;
  goal: number;
  end_date: moment.Moment;
} {
  let ret = {
    deposit: 0,
    goal: 0,
    end_date: null,
  };
  let today, balance;
  if (args) {
    today = args.today !== null ? ensureLocalMoment(args.today) : moment.utc();
    balance = args.balance !== null ? args.balance : b.balance;
  }
  switch (b.kind) {
    case 'deposit': {
      ret.deposit = b.deposit;
      break;
    }
    case 'goal-deposit': {
      Object.assign(ret, {
        goal: b.goal,
        deposit: b.deposit,
        end_date: computeGoalEndDate(balance, b.goal, b.deposit, today),
      })
      break;
    }
    case 'goal-date': {
      Object.assign(ret, {
        goal: b.goal,
        deposit: computeGoalDeposit(balance, b.goal, b.end_date, today),
        end_date: ensureLocalMoment(b.end_date),
      })
      break;
    }
    case 'deposit-date': {
      Object.assign(ret, {
        goal: computeGoal(balance, b.deposit, b.end_date, today),
        deposit: b.deposit,
        end_date: ensureLocalMoment(b.end_date),
      })
      break;
    }
    default: {
      Object.assign(ret, {
        goal: b.goal || 0,
        deposit: b.deposit || 0,
        end_date: b.end_date || null,
      })
    }
  }
  return ret;
}

function computeGoalEndDate(balance:number, goal:number, deposit:number, today:Timestamp):Timestamp {
  if (!deposit) {
    return null;
  }
  let units = Math.ceil((goal - balance) / deposit);
  let dt = ensureLocalMoment(today);
  return dt.add(units, 'month').startOf('month');
}
function computeGoalDeposit(balance:number, goal:number, end_date:Timestamp, today:Timestamp):number {
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
function computeGoal(balance:number, deposit:number, end_date:Timestamp, today:Timestamp):number {
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