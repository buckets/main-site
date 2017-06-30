import {IObject, IStore} from '../store'
import {ts2db, Timestamp} from '../time'
import {Balances, computeBalances} from './balances'

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


export class BucketStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async add(args?:{name:string}):Promise<Bucket> {
    let data = args || {};
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
}