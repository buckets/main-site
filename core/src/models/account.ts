import * as moment from 'moment-timezone'
import { CustomError } from '../errors'
import { IObject, IStore } from '../store';
import { ts2localdb, parseLocalTime, dumpTS, SerializedTimestamp } from '../time';
import { Balances, computeBalances } from './balances';
import { INotable } from './notes'


declare module '../store' {
  interface IObjectTypes {
    account: Account;
    account_transaction: Transaction;
    unknown_account: UnknownAccount;
    account_mapping: AccountMapping;
    csv_import_mapping: CSVImportMapping;
  }
  interface ISubStore {
    accounts: AccountStore;
  }
}

export class Failure extends Error {}

export class SignMismatch extends CustomError {}
export class SumMismatch extends CustomError {}

export type GeneralCatType =
  ''
  | 'income'
  | 'transfer';


export interface Account extends IObject, INotable {
  _type: 'account';
  id: number;
  created: string;
  name: string;
  balance: number;
  notes: string;
  import_balance: number;
  currency: string;
  closed: boolean;
  offbudget: boolean;
  is_debt: boolean;
  debt_payment: number;
}

export interface Transaction extends IObject, INotable {
  _type: 'account_transaction';
  id: number;
  created: string;
  notes: string;
  posted: string;
  account_id: number;
  amount: number;
  memo: string;
  fi_id: string;
  general_cat: GeneralCatType;
  cleared: boolean;
}

export interface UnknownAccount extends IObject {
  _type: 'unknown_account'
  id: number;
  created: string;

  description: string;
  account_hash: string;
}

export interface AccountMapping extends IObject {
  _type: 'account_mapping'
  id: number;
  created: string;

  account_id: number;
  account_hash: string;
}

export interface CSVImportMapping extends IObject {
  _type: 'csv_import_mapping'
  id: number;
  created: string;

  fingerprint_hash: string;
  mapping_json: string;
}




export interface Category {
  bucket_id: number;
  amount: number;
}

export function expectedBalance(a:Account):number {
  if (a.import_balance === null) {
    return a.balance;
  } else {
    return a.import_balance;
  }
}


export interface ImportArgs {
  account_id: number;
  amount: number;
  memo: string;
  posted: moment.Moment;
  fi_id: string;
}

export interface TransactionExportRow {
  t_id: number;
  t_amount: number;
  t_memo: string;
  t_posted: string;
  a_name: string;
  bt_id: number;
  bt_amount: number;
  b_name: string;
}

/**
 *
 */
export class AccountStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async add(name:string):Promise<Account> {
    return this.store.createObject('account', {
      name: name,
      balance: 0,
      currency: 'USD',
    });
  }
  async get(account_id: number):Promise<Account> {
    return this.store.getObject('account', account_id);
  }
  async update(account_id:number, data:{
      name?:string,
      balance?:number,
      import_balance?:number,
      offbudget?:boolean,
  }):Promise<any> {
    return this.store.updateObject('account', account_id, data);
  }
  async close(account_id:number):Promise<Account> {
    if (await this.hasTransactions(account_id)) {
      // mark as close
      return this.store.updateObject('account', account_id, {closed: true});
    } else {
      // actually delete it
      let old_account = await this.get(account_id);
      return this.deleteWholeAccount(account_id)
      .then(() => {
        return old_account
      });
    }
  }
  async unclose(account_id:number):Promise<Account> {
    return this.store.updateObject('account', account_id, {closed: false});
  }
  /**
   *  Delete an account and all its transactions
   */
  async deleteWholeAccount(account_id:number) {
    // This is not very efficient, but is done this way so that everything is properly notified about the deletions

    // Delete bucket transactions first before we lose the ids
    let btrans_ids = (await this.store.query<{id:number}>(`SELECT id FROM bucket_transaction WHERE
      account_trans_id IN (SELECT id FROM account_transaction WHERE account_id=$id)`, {$id: account_id}))
      .map(x=>x.id);
    await this.store.sub.buckets.deleteTransactions(btrans_ids)

    // Delete account transactions
    let atrans_ids = (await this.store.query<{id:number}>(`SELECT id FROM account_transaction WHERE account_id=$id;`, {$id: account_id}))
      .map(x=>x.id);
    await this.deleteTransactions(atrans_ids)

    // Delete misc other stuff connected to accounts
    let mapping_ids = (await this.store.query<{id:number}>(`SELECT id FROM account_mapping WHERE account_id=$id;`, {$id: account_id}))
      .map(x=>x.id);
    for (let mapping_id of mapping_ids) {
      await this.store.deleteObject('account_mapping', mapping_id);
    }

    // Delete the account itself
    await this.store.deleteObject('account', account_id);
  }
  /**
   *  Make this account a debt account or not
   */
  async setDebtMode(account_id:number, is_debt:boolean):Promise<Account> {
    return this.store.updateObject('account', account_id, {is_debt: is_debt})
  }

  async transact(args:{
    account_id:number,
    amount:number,
    memo:string,
    posted?:moment.Moment,
    fi_id?:string,
  }):Promise<Transaction> {
    let data:any = {
      account_id: args.account_id,
      amount: args.amount || 0,
      memo: args.memo,
    };
    if (args.posted) {
      data.posted = ts2localdb(args.posted)
    }
    if (args.account_id === null) {
      throw new Error('You must provide an account');
    }
    if (args.fi_id) {
      data.fi_id = args.fi_id;
    }
    let trans = await this.store.createObject('account_transaction', data);
    let account = await this.store.getObject('account', args.account_id);
    this.store.publishObject('update', account);
    return trans;
  }
  async updateTransaction(trans_id:number, args:{
    account_id?: number,
    amount?: number,
    memo?: string,
    posted?: moment.Moment,
    fi_id?: string,
    cleared?: boolean,
  }):Promise<Transaction> {
    let affected_account_ids = new Set<number>();
    let existing = await this.store.getObject('account_transaction', trans_id);

    if (args.account_id !== undefined && existing.account_id !== args.account_id) {
      affected_account_ids.add(existing.account_id);
      affected_account_ids.add(args.account_id);
    }
    if (args.amount !== undefined && existing.amount !== args.amount) {
      affected_account_ids.add(existing.account_id);
      this.removeCategorization(trans_id, false);
      args.amount = args.amount || 0;
    }
    let trans = await this.store.updateObject('account_transaction', trans_id, {
      account_id: args.account_id,
      amount: args.amount,
      memo: args.memo,
      posted: args.posted ? ts2localdb(args.posted) : undefined,
      fi_id: args.fi_id,
      cleared: args.cleared,
    });

    // publish affected accounts
    await Promise.all(Array.from(affected_account_ids).map(async (account_id) => {
      let account = await this.store.getObject('account', account_id);
      this.store.publishObject('update', account);
    }));
    return trans;
  }

  async hasTransactions(account_id:number):Promise<boolean> {
    let rows = await this.store.query(`SELECT id FROM account_transaction
      WHERE
        account_id = $account_id
      LIMIT 1`, {
          $account_id: account_id,
        })
    return rows.length !== 0;
  }
  async countTransactions(account_id:number):Promise<number> {
    let rows = await this.store.query(`SELECT count(*) FROM
      account_transaction
      WHERE
        account_id = $account_id`, {
          $account_id: account_id,
        })
    return rows[0][0];
  }
  async exportTransactions(args:{
    onOrAfter?: moment.Moment,
    before?: moment.Moment,
  } = {}):Promise<Array<TransactionExportRow>> {
    let params:any = {};
    let where_parts = [];

    if (args.onOrAfter) {
      where_parts.push('t.posted >= $onOrAfter');
      params.$onOrAfter = ts2localdb(args.onOrAfter);
    }
    if (args.before) {
      where_parts.push('t.posted < $before');
      params.$before = ts2localdb(args.before);
    }

    let where = '';
    if (where_parts.length) {
      where = `WHERE ${where_parts.join(' AND ')}`;
    }
    return await this.store.query<TransactionExportRow>(`SELECT
      t.id as t_id,
      t.amount as t_amount,
      t.memo as t_memo,
      t.posted as t_posted,
      a.name as a_name,
      bt.id as bt_id,
      bt.amount as bt_amount,
      b.name as b_name
    FROM
      account_transaction as t
      LEFT JOIN account as a
        ON t.account_id = a.id
      LEFT JOIN bucket_transaction as bt
        ON t.id = bt.account_trans_id
      LEFT JOIN bucket as b
        ON bt.bucket_id = b.id
    ${where}
    ORDER BY
      t.posted DESC,
      t.id DESC`, {
    });
  }

  async importTransactions(transactions:ImportArgs[]) {
    let num_new = 0;
    let num_updated = 0;
    let imported = await Promise.all(transactions.map(async trans => {
      let result = await this.importTransaction(trans);
      if (result.isupdate) {
        num_updated += 1;
      } else {
        num_new += 1;
      }
      return result.transaction;
    }))
    return {
      transactions: imported,
      num_new,
      num_updated,
    }
  }

  async importTransaction(args: ImportArgs):Promise<{
    isupdate: boolean,
    transaction: Transaction,
  }> {
    let rows = await this.store.query<{id:number}>(`SELECT id
      FROM account_transaction
      WHERE
        account_id = $account_id
        AND fi_id = $fi_id LIMIT 1`, {
          $account_id: args.account_id,
          $fi_id: args.fi_id,
        })
    if (rows.length) {
      // Update existing
      let existing_id:number = rows[0].id;
      let ret = await this.store.updateObject('account_transaction', existing_id, {
        account_id: args.account_id,
        amount: args.amount || 0,
        memo: args.memo,
        posted: ts2localdb(args.posted),
        fi_id: args.fi_id,
      })
      this.store.getObject('account', args.account_id)
      .then(account => {
        this.store.publishObject('update', account);  
      })
      return {
        transaction: ret,
        isupdate: true,
      }
    } else {
      // Create new transaction
      let transaction = await this.transact({
        account_id: args.account_id,
        amount: args.amount || 0,
        posted: args.posted,
        memo: args.memo,
        fi_id: args.fi_id,
      })
      return {
        transaction,
        isupdate: false,
      }
    }
  }

  async deleteTransactions(transaction_ids:number[]) {
    let affected_account_ids = new Set();
    let affected_bucket_ids = new Set();
    let deleted_btrans = [];

    // This could be optimized later
    await Promise.all(transaction_ids.map(async (transid) => {
      let trans = await this.store.getObject('account_transaction', transid);
      affected_account_ids.add(trans.account_id)
      let btrans_list = await this.store.sub.buckets.listTransactions({
        account_trans_id: transid,
      })
      btrans_list.forEach(btrans => {
        deleted_btrans.push(btrans);
        affected_bucket_ids.add(btrans.bucket_id);  
      })
      await this.store.deleteObject('account_transaction', transid);
    }));

    // publish changed accounts
    await Promise.all(Array.from(affected_account_ids).map(async (account_id) => {
      let account = await this.store.getObject('account', account_id);
      this.store.publishObject('update', account);
    }));

    // publish deleted bucket transactions
    await Promise.all(deleted_btrans.map(btrans => {
      return this.store.publishObject('delete', btrans);
    }));

    // publish changed buckets
    await Promise.all(Array.from(affected_bucket_ids).map(async bucket_id => {
      let bucket = await this.store.sub.buckets.get(bucket_id);
      this.store.publishObject('update', bucket);
    }))
  }

  //------------------------------------------------------------
  // account mapping
  //------------------------------------------------------------
  async hashToAccountId(hash:string):Promise<number|null> {
    let rows = await this.store.query<{account_id:number}>(`SELECT account_id FROM account_mapping
        WHERE account_hash=$hash`, {$hash: hash})
    if (rows.length) {
      return rows[0].account_id;
    } else {
      return null;
    }
  }
  async getOrCreateUnknownAccount(args:{description:string, account_hash:string}):Promise<UnknownAccount> {
    let rows = await this.store.query<{id:number}>(`SELECT id FROM unknown_account WHERE account_hash=$hash`, {$hash: args.account_hash});
    if (rows.length === 1) {
      return this.store.getObject('unknown_account', rows[0].id);
    } else {
      await this.store.createObject('unknown_account', {
        description: args.description,
        account_hash: args.account_hash,
      })
    }
  }
  async linkAccountToHash(hash:string, account_id:number) {
    await this.store.createObject('account_mapping', {
      account_id: account_id,
      account_hash: hash,
    })
    let unknowns = await this.store.listObjects('unknown_account', {
      where: 'account_hash = $account_hash',
      params: { $account_hash: hash },
    })
    let promises = unknowns.map(unknown => {
      return this.store.deleteObject('unknown_account', unknown.id)
    })
    await Promise.all(promises);
  }
  /**
   *  Return true if an account has at least one AccountMapping
   */
  async hasAccountMappings(account_id:number) {
    let rows = await this.store.query(`SELECT id FROM account_mapping
      WHERE
        account_id = $account_id
      LIMIT 1`, {
          $account_id: account_id,
        })
    return rows.length !== 0;
  }
  /**
   *  Delete all of an account's import mappings
   */
  async deleteAccountMappings(account_id:number) {
    let mappings = await this.store.listObjects('account_mapping', {
      where: 'account_id = $account_id',
      params: { $account_id: account_id },
    })
    await Promise.all(mappings.map(mapping => {
      this.store.deleteObject('account_mapping', mapping.id);
    }))
  }
  async getCSVMapping(fingerprint:string) {
    let rows = await this.store.query<{id:number}>(`SELECT id FROM csv_import_mapping WHERE fingerprint_hash=$fingerprint`, {$fingerprint: fingerprint});
    if (rows.length) {
      return this.store.getObject('csv_import_mapping', rows[0].id);
    } else {
      return null;
    }
  }
  async setCSVMapping(fingerprint:string, mapping:object) {
    let obj = await this.getCSVMapping(fingerprint);
    if (obj === null) {
      // does not exist
      return await this.store.createObject('csv_import_mapping', {
        fingerprint_hash: fingerprint,
        mapping_json: JSON.stringify(mapping),
      })
    } else {
      return await this.store.updateObject('csv_import_mapping', obj.id, {
        mapping_json: JSON.stringify(mapping),
      })
    }
  }

  async balances(asof?:moment.Moment, opts:{
    onbudget_only?:boolean,
  }={}):Promise<Balances> {
    let where = 'a.closed <> 1'
    let params = {};
    if (opts.onbudget_only) {
      where += ' AND a.offbudget = 0'
    }
    return computeBalances(this.store, 'account', 'account_transaction', 'account_id', asof, where, params);
  }
  async balanceDate(account_id:number, before:moment.Moment):Promise<SerializedTimestamp> {
    const rows = await this.store.query<{posted:string}>(`SELECT max(posted) AS posted
      FROM account_transaction
      WHERE
        account_id = $account_id
        AND posted < $before`, {
          $account_id: account_id,
          $before: ts2localdb(before),
        })
    if (!rows.length) {
      return null;
    }
    const posted = rows[0].posted;
    if (!posted) {
      return null
    } else {
      return dumpTS(parseLocalTime(posted))
    }
  }
  async unclearedTotal(account_id:number, asof:moment.Moment):Promise<number> {
    const rows = await this.store.query<{amount:number}>(`SELECT sum(amount) as amount
      FROM account_transaction
      WHERE
        account_id = $account_id
        AND posted < $before
        AND cleared = 0
        AND fi_id IS NULL`, {
        $account_id: account_id,
        $before: ts2localdb(asof),
      })
    if (!rows.length) {
      return 0;
    } else {
      return rows[0].amount || 0;
    }
  }
  async list():Promise<Account[]> {
    return this.store.listObjects('account', {
      order: ['name ASC', 'id'],
    });
  }
  async listTransactions(args?:{
    account_id?:number,
    posted?:{
      onOrAfter?:moment.Moment,
      before?:moment.Moment,
    },
    countedAsTransfer?: boolean,
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
          params['$onOrAfter'] = ts2localdb(args.posted.onOrAfter);
        }
        if (args.posted.before) {
          where_parts.push('posted < $before');
          params['$before'] = ts2localdb(args.posted.before);
        }
      }

      // transfer
      if (args.countedAsTransfer) {
        if (!args.posted || !args.posted.onOrAfter || !args.posted.before) {
          throw new Error('Must supply posted contraint for countedAsTransfer query');
        }
        where_parts.push(`id not in (
          SELECT
            id
          FROM account_transaction
          WHERE
            coalesce(general_cat, '') <> 'transfer'
            AND posted >= $onOrAfter
            AND posted < $before
            AND amount > 0
        )`)
        where_parts.push(`id not in (
          SELECT
            id
          FROM account_transaction
          WHERE
            coalesce(general_cat, '') <> 'transfer'
            AND posted >= $onOrAfter
            AND posted < $before
            AND amount <= 0
        )`)
      }
    }

    let where = where_parts.join(' AND ');
    return this.store.listObjects('account_transaction', {where, params,
      order: ['posted DESC', 'id DESC']});
  }

  //------------------------------------------------------------
  // categorizing
  //------------------------------------------------------------
  async categorize(trans_id:number, categories:Category[]):Promise<Category[]> {
    let trans = await this.store.getObject('account_transaction', trans_id);

    // ignore 0s and null bucket ids
    categories = categories.filter(cat => {
      return cat.amount && cat.bucket_id !== null;
    })

    // make sure the sum is right and the signs are right
    let sign = Math.sign(trans.amount);
    let sum = categories.reduce((sum, cat) => {
      if (Math.sign(cat.amount) !== sign) {
        throw new SignMismatch(`Categories must match sign of transaction (${trans.amount}); invalid: ${cat.amount}`);
      }
      if (cat.bucket_id === null) {
        throw new Failure(`You must choose a bucket.`);
      }
      return sum + cat.amount;
    }, 0)

    if (sum !== trans.amount) {
      throw new SumMismatch(`Categories must add up to ${trans.amount} not ${sum}`);
    }

    // delete old
    await this.removeCategorization(trans_id, false)

    // create new bucket transactions
    await Promise.all(categories.map(cat => {
      return this.store.sub.buckets.transact({
        bucket_id: cat.bucket_id,
        amount: cat.amount,
        memo: trans.memo,
        posted: parseLocalTime(trans.posted),
        account_trans_id: trans.id,
      })  
    }))
    trans = await this.store.getObject('account_transaction', trans_id);
    await this.store.publishObject('update', trans);
    return categories;
  }
  async removeCategorization(trans_id:number, publish:boolean):Promise<any> {
    // delete old
    let old_ids = await this.store.query<{id:number}>('SELECT id FROM bucket_transaction WHERE account_trans_id = $id',
      {$id: trans_id});
    await this.store.sub.buckets.deleteTransactions(old_ids.map(obj => obj.id))
    await this.store.query(`
      UPDATE account_transaction
      SET general_cat = ''
      WHERE id = $id`, {$id: trans_id})
    if (publish) {
      const trans = await this.store.getObject('account_transaction', trans_id);
      this.store.publishObject('update', trans);
    }
  }
  async categorizeGeneral(trans_id:number, category:GeneralCatType):Promise<Transaction> {
    // delete old
    await this.removeCategorization(trans_id, false)
    return this.store.updateObject('account_transaction', trans_id, {general_cat: category})
  }
  async getManyCategories(trans_ids:number[]):Promise<{[trans_id:number]:Category[]}> {
    const row_promise = this.store.query(`
      SELECT account_trans_id, bucket_id, amount
      FROM bucket_transaction
      WHERE account_trans_id in (${trans_ids.join(',')})
      ORDER BY 1,2,3
      `, {})
    let ret = {};
    trans_ids.forEach(id => {
      ret[id] = [];
    })
    const rows = await row_promise;
    rows.forEach(({account_trans_id, bucket_id, amount}) => {
      ret[account_trans_id].push({
        bucket_id,
        amount,
      })
    })
    return ret;
  }
  async getCategories(trans_id:number):Promise<Category[]> {
    return this.store.query<{bucket_id:number, amount:number}>(
      `SELECT bucket_id, amount
      FROM bucket_transaction
      WHERE account_trans_id = $trans_id
      ORDER by id`, {
        $trans_id: trans_id,
    })
  }
}

