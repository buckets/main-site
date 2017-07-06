import {IObject, IStore} from '../store'
import {ts2db, Timestamp} from '../time'
import {Balances, computeBalances} from './balances'
import { rankBetween } from '../ranking'

type BucketKind =
  ''
  | 'goal';

export class Bucket implements IObject {
  static table_name: string = 'bucket';
  id: number;
  created: string;
  readonly _type: string = Bucket.table_name;
  name: string;
  notes: string;
  balance: number;
  kicked: boolean;
  group_id: number;
  ranking: string;
  kind: BucketKind;
  color: string;

  static fromdb(obj:Bucket) {
    // convert to boolean
    obj.kicked = !!obj.kicked;
    return obj;
  }
}
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
}
export class Group implements IObject {
  static table_name: string = 'bucket_group';
  id: number;
  created: string;
  readonly _type: string = Group.table_name;
  name: string;
  ranking: string;
}


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

  async transact(args:{
    bucket_id: number,
    amount: number,
    memo?: string,
    posted?: Timestamp,
    account_trans_id?: number,
  }):Promise<Transaction> {
    let data:any = {
      bucket_id: args.bucket_id,
      amount: args.amount,
      memo: args.memo || '',
      account_trans_id: args.account_trans_id || null,
    };
    if (args.posted) {
      data.posted = ts2db(args.posted)
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
      asof)
  }
  async listTransactions(args:{
    bucket_id: number,
  }):Promise<Transaction[]> {
    let where_parts:string[] = [];
    let params:any = {};

    if (args) {
      // bucket
      if (args.bucket_id !== undefined) {
        where_parts.push('bucket_id = $bucket_id');
        params['$bucket_id'] = args.bucket_id;
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
  async updateGroup(id:number, data:{name?:string, ranking?:string}):Promise<Group> {
    return this.store.updateObject(Group, id, data);
  }
}