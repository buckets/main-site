import {IObject, IStore} from '../store';
import * as moment from 'moment';

export class Balances {
  [k:number]:number;
}
export class Account implements IObject {
  static table_name: string = 'account';
  id: number;
  created: Date;
  readonly _type: string = Account.table_name;
  name: string;
  balance: number;
  currency: string;
}
export class Transaction implements IObject {
  static table_name: string = 'account_transaction';
  id: number;
  created: Date;
  readonly _type: string = Transaction.table_name;
  account_id: number;
  amount: number;
  memo: string;
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
    console.log(`AccountStore.update(${account_id}, ${data})`);
    return this.store.updateObject(Account, account_id, data);
  }
  // posted is a UTC time
  async transact(account_id:number, amount:number, memo:string, posted?:string):Promise<Transaction> {
    let data:any = {
      account_id: account_id,
      amount: amount,
      memo: memo,
    };
    if (posted) {
      data.posted = posted;
    }
    let trans = await this.store.createObject(Transaction, data);
    let account = await this.store.getObject(Account, account_id);
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
  async balances(asof?:string):Promise<Balances> {
    if (!asof) {
      asof = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    }
    let sql = `
      SELECT
        a.id, a.balance - sum(coalesce(t.amount,0)) as balance, sum(t.amount)
      FROM
        account as a
        left join account_transaction as t
          on a.id = t.account_id
             AND t.posted >= $asof
      GROUP BY 1
    `;
    let params = {
      $asof: asof,
    }
    let rows = await this.store.query(sql, params);
    let ret:Balances = {};
    rows.forEach(row => {
      ret[row.id] = row.balance;
    })
    return ret;
  }
  async list():Promise<Account[]> {
    return this.store.listObjects(Account);
  }
}

