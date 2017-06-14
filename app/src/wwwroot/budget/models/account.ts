import {IObject, Store} from '../store';

type account_type = 'account'

export function isAccount(obj: IObject): obj is Account {
  return obj._type === 'account';
}
export interface Account extends IObject {
  _type: account_type;
  name: string;
  balance: number;
  currency: string;
}

export class AccountStore {
  public store:Store;
  constructor(store:Store) {
    this.store = store;
  }
  async add(name:string):Promise<Account> {
    return this.store.createObject('account', {
      name: name,
      balance: 0,
      currency: 'USD',
    }) as Promise<Account>;
  }
  async transact(account_id:number, amount:number, memo:string):Promise<Transaction> {
    let trans = <Transaction>await this.store.createObject('account_transaction', {
      account_id: account_id,
      amount: amount,
      memo: memo,
    });
    let account = await this.store.getObject<Account>('account', account_id);
    this.store.publishObject('update', account);
    return trans;
  }
  async deleteTransactions(transaction_ids:number[]) {
    let affected_account_ids = new Set();

    // This could be optimized later
    await Promise.all(transaction_ids.map(async (transid) => {
      let trans = await this.store.getObject<Transaction>('account_transaction', transid);
      affected_account_ids.add(trans.account_id)
      await this.store.deleteObject('account_transaction', transid);
    }));
    console.log('affected ids', affected_account_ids);
    await Promise.all(Array.from(affected_account_ids).map(async (account_id) => {
      let account = await this.store.getObject<Account>('account', account_id);
      this.store.publishObject('update', account);
    }));
  }
}

type account_transaction_type = 'account_transaction';

export function isTransaction(obj: IObject): obj is Transaction {
  return obj._type === 'account_transaction';
}
export interface Transaction extends IObject {
  _type: account_transaction_type;
  account_id: number;
  amount: number;
  memo: string;
}