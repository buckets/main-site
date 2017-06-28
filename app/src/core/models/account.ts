import {IObject, IStore} from '../store';
import * as moment from 'moment';

function ensureUTCMoment(x:Timestamp):moment.Moment {
  if (moment.isMoment(x)) {
    return x.utc()
  } else {
    return moment.utc(x)
  }
}
function ts2db(x:Timestamp):string {
  return ensureUTCMoment(x).format('YYYY-MM-DD HH:mm:ss');
}

type Timestamp = string | moment.Moment;

export class Balances {
  [k:number]:number;
}
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
  general_cat: string;
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
  async transact(args:{account_id:number, amount:number, memo:string, posted?:Timestamp}):Promise<Transaction> {
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
    if (!asof) {
      asof = ts2db(moment.utc())
    } else {
      asof = ts2db(asof);
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
}

