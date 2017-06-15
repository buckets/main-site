import {IObject, Store} from '../store';

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
  public store:Store;
  constructor(store:Store) {
    this.store = store;
  }
  async add(name:string):Promise<Account> {
    return this.store.createObject(Account, {
      name: name,
      balance: 0,
      currency: 'USD',
    });
  }
  async transact(account_id:number, amount:number, memo:string):Promise<Transaction> {
    let trans = await this.store.createObject(Transaction, {
      account_id: account_id,
      amount: amount,
      memo: memo,
    });
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
}

