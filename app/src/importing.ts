import * as fs from 'fs-extra-promise'
import * as moment from 'moment'
import * as crypto from 'crypto'
import * as log from 'electron-log'

import { Account, Transaction, UnknownAccount } from './models/account'
import { ofx2importable } from './ofx'
import { EventSource } from './events'
import { IStore, IObject, registerClass } from './store'

/**
 *  Hash a list of strings in a consistent way.
 */
export function hashStrings(strings:string[]):string {
  let ret = crypto.createHash('sha256');
  strings.forEach(s => {
    let hash = crypto.createHash('sha256');
    hash.update(s)
    ret.update(hash.digest('hex'))
  });
  return ret.digest('hex');
}

export interface ImportableAccountSet {
  accounts: ImportableAccount[];
}
export interface ImportableAccount {
  label: string;
  transactions: ImportableTrans[];
  currency?:string;
}
export interface ImportableTrans {
  amount:number;
  memo:string;
  posted:moment.Moment;
  fi_id?:string;
}
export interface PendingImport {
  account: ImportableAccount;
  hash: string;

}


/**
 *  Read and import data from a transaction file into the store.
 *
 *  If further action is required, objects will be added to the
 *  store/memory store.
 */
export async function importFile(store:IStore, path:string) {
  let set:ImportableAccountSet;
  let data = await fs.readFileAsync(path, {encoding:'utf8'});
  try {
    set = await ofx2importable(data);
  } catch(err) {
    // XXX in the future (when there are more supported file types)
    // This will try the next file type instead of throwing.
    throw err;
  }
  // The file has been parsed, can we match it up with 

  let imported:Transaction[] = [];
  let pendings:PendingImport[] = [];

  for (let account of set.accounts) {
    let hash = hashStrings([account.label]);
    let account_id = await this.store.accounts.hashToAccountId(hash);
    if (account_id) {
      // matching account
      imported = imported.concat(await Promise.all(account.transactions.map(trans => {
        return this.store.accounts.importTransaction({
          account_id,
          amount: trans.amount,
          memo: trans.memo,
          posted: trans.posted,
          fi_id: trans.fi_id,
        })
      })))
    } else {
      // no matching account
      await this.store.accounts.getOrCreateUnknownAccount({
        description: account.label,
        account_hash: hash,
      });
      await this.store.memory
      let pending = {
        account,
        hash,
      }
      pendings.push(pending);
    }
  }
  return {
    imported,
    pendings,
  }
}

/**
 This class represents a file that's is about to be imported, was imported or has errors.
 */
export class FileImport {

  // If there was an error during import, this will contain that error
  // as a user-readable string.
  public error: string;

  // List of PendingImports for which not matching account can be found.
  public pending: PendingImport[] = [];

  // List of successfully imported transactions
  public imported: Transaction[] = [];

  readonly events = {
    account_created: new EventSource<Account>(),
    account_linked: new EventSource<{
      label: string,
      account_id:number,
    }>(),
    imported: new EventSource<Transaction[]>(),
    done: new EventSource<boolean>(),
  }

  constructor(readonly store:IStore, readonly path:string) {

  }

  async run() {
    // reset state
    this.error = null;
    this.pending = null;
    this.imported = [];

    // try ofx
    let set:ImportableAccountSet;
    try {
      let data = await fs.readFileAsync(this.path, {encoding:'utf8'});
      set = await ofx2importable(data);
    } catch(err) {
      this.error = err.toString();
      return;
    }

    let imported:Transaction[];

    for (let account of set.accounts) {
      let hash = hashStrings([account.label]);
      let account_id = await this.store.accounts.hashToAccountId(hash);
      if (account_id) {
        // matching account
        imported = imported.concat(await Promise.all(account.transactions.map(trans => {
          return this.store.accounts.importTransaction({
            account_id,
            amount: trans.amount,
            memo: trans.memo,
            posted: trans.posted,
            fi_id: trans.fi_id,
          })
        })))
      } else {
        // no matching account
        await this.store.accounts.getOrCreateUnknownAccount({
          description: account.label,
          account_hash: hash,
        });
        this.pending.push({
          account,
          hash,
        })
      }
    }

    this.events.imported.emit(this.imported);
    if (!this.pending.length) {
      this.events.done.emit(true);
    }
  }
  /**
   *  @param account_id  If "NEW" then a new account will be created.
   */
  async finish(hash:string, account_id: number|'NEW') {
    let list = this.pending.filter(p => p.hash === hash);
    if (!list.length) {
      log.warn('Attempting to finish an already finished import');
      return;
    }
    let pending = list[0];
    let numeric_account_id:number;

    if (account_id === 'NEW') {
      // Make a new account
      let new_account = await this.store.accounts.add(pending.account.label)
      account_id = new_account.id;
      numeric_account_id = new_account.id;
      await this.store.accounts.linkAccountToHash(pending.hash, new_account.id);
      this.events.account_created.emit(new_account);
    } else {
      // Link to an existing account
      numeric_account_id = account_id;
      await this.store.accounts.linkAccountToHash(pending.hash, account_id);
      this.events.account_linked.emit({label: pending.account.label, account_id})
    }
    
    let newly_imported = await Promise.all(pending.account.transactions.map(trans => {
      return this.store.accounts.importTransaction({
        account_id: numeric_account_id,
        amount: trans.amount,
        memo: trans.memo,
        posted: trans.posted,
        fi_id: trans.fi_id,
      })
    }));
    this.imported = this.imported.concat(newly_imported);

    // no longer pending
    this.pending.splice(this.pending.indexOf(pending), 1);

    this.events.imported.emit(newly_imported);
    if (!this.pending.length) {
      this.events.done.emit(true);
    }
  }
}

export function finishImport(pending_import:PendingImport, )
