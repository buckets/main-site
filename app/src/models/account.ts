import {IObject, IStore} from '../store';
import {Timestamp, ts2db} from '../time';
import {Balances, computeBalances} from './balances';

export class Failure extends Error {

}

export type GeneralCatType =
  ''
  | 'income'
  | 'transfer';


export class Account implements IObject {
  static table_name: string = 'account';
  id: number;
  created: string;
  readonly _type: string = Account.table_name;
  name: string;
  balance: number;
  currency: string;
}
export class Transaction implements IObject {
  static table_name: string = 'account_transaction';
  id: number;
  created: string;
  posted: string;
  readonly _type: string = Transaction.table_name;
  account_id: number;
  amount: number;
  memo: string;
  fi_id: string;
  general_cat: GeneralCatType;
}
export interface Category {
  bucket_id: number;
  amount: number;
}

export class AccountStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async add(name:string):Promise<Account> {
    return this.store.createObject(Account, {
      name: name,
      balance: 0,
      currency: 'USD',
    });
  }
  async update(account_id:number, data:{name:string}):Promise<any> {
    return this.store.updateObject(Account, account_id, data);
  }
  // posted is a UTC time
  async transact(args:{
    account_id:number,
    amount:number,
    memo:string,
    posted?:Timestamp,
  }):Promise<Transaction> {
    let data:any = {
      account_id: args.account_id,
      amount: args.amount,
      memo: args.memo,
    };
    if (args.posted) {
      data.posted = ts2db(args.posted)
    }
    let trans = await this.store.createObject(Transaction, data);
    let account = await this.store.getObject(Account, args.account_id);
    this.store.publishObject('update', account);
    return trans;
  }
  async deleteTransactions(transaction_ids:number[]) {
    let affected_account_ids = new Set();

    // This could be optimized later
    await Promise.all(transaction_ids.map(async (transid) => {
      let trans = await this.store.getObject(Transaction, transid);
      affected_account_ids.add(trans.account_id)
      await this.store.deleteObject(Transaction, transid);
    }));
    await Promise.all(Array.from(affected_account_ids).map(async (account_id) => {
      let account = await this.store.getObject(Account, account_id);
      this.store.publishObject('update', account);
    }));
  }
  // asof is a UTC time
  async balances(asof?:Timestamp):Promise<Balances> {
    return computeBalances(this.store, 'account', 'account_transaction', 'account_id', asof);
  }
  async list():Promise<Account[]> {
    return this.store.listObjects(Account, {
      order: ['name ASC', 'id'],
    });
  }
  async listTransactions(args?:{
    account_id?:number,
    posted?:{
      onOrAfter?:Timestamp,
      before?:Timestamp,
    },
  }):Promise<Transaction[]> {
    let where_parts:string[] = [];
    let params:any = {};

    if (args) {
      // account
      if (args.account_id !== undefined) {
        where_parts.push('account_id = $account_id');
        params['$account_id'] = args.account_id;
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

  //------------------------------------------------------------
  // categorizing
  //------------------------------------------------------------
  async categorize(trans_id:number, categories:Category[]):Promise<Category[]> {
    let trans = await this.store.getObject(Transaction, trans_id);

    // ignore 0s and null bucket ids
    categories = categories.filter(cat => {
      return cat.amount && cat.bucket_id !== null;
    })

    // make sure the sum is right and the signs are right
    let sign = Math.sign(trans.amount);
    let sum = categories.reduce((sum, cat) => {
      if (Math.sign(cat.amount) !== sign) {
        throw new Failure(`Categories must match sign of transaction (${trans.amount}); invalid: ${cat.amount}`);
      }
      if (cat.bucket_id === null) {
        throw new Failure(`You must choose a bucket.`);
      }
      return sum + cat.amount;
    }, 0)

    if (sum !== trans.amount) {
      throw new Failure(`Categories must add up to ${trans.amount} not ${sum}`);
    }

    // delete old
    await this.removeCategorization(trans_id)

    // create new bucket transactions
    await Promise.all(categories.map(cat => {
      return this.store.buckets.transact({
        bucket_id: cat.bucket_id,
        amount: cat.amount,
        memo: trans.memo,
        posted: trans.posted,
        account_trans_id: trans.id,
      })  
    }))
    trans = await this.store.getObject(Transaction, trans_id);
    await this.store.publishObject('update', trans);
    return categories;
  }
  async removeCategorization(trans_id:number):Promise<any> {
    // delete old
    let old_ids = await this.store.query('SELECT id FROM bucket_transaction WHERE account_trans_id = $id',
      {$id: trans_id});
    await this.store.buckets.deleteTransactions(old_ids.map(obj => obj.id))
    await this.store.query(`
      UPDATE account_transaction
      SET general_cat = ''
      WHERE id = $id`, {$id: trans_id})
  }
  async categorizeGeneral(trans_id:number, category:GeneralCatType):Promise<Transaction> {
    // delete old
    await this.removeCategorization(trans_id)
    return this.store.updateObject(Transaction, trans_id, {general_cat: category})
  }
  async getCategories(trans_id:number):Promise<Category[]> {
    return this.store.query(
      `SELECT bucket_id, amount
      FROM bucket_transaction
      WHERE account_trans_id = $trans_id
      ORDER by id`, {
        $trans_id: trans_id,
    })
  }
}

