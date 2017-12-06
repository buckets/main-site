import * as fs from 'fs-extra-promise'
import * as moment from 'moment'

import { hashStrings } from './models/simplefin'
import { Account, Transaction } from './models/account'
import { ofx2importable } from './ofx'
import { EventSource } from './events'
import { IStore } from './store'

export interface ImportableTrans {
  account_label: string;
  amount:number;
  memo:string;
  posted:moment.Moment;
  fi_id?:string;
  currency?:string;
}

export interface PendingImport {
  transactions: ImportableTrans[];
  account_label: string;
  hash: string;
}

/**
 This class represents a file that's is about to be imported, is imported, was imported or has errors.
 */
export class FileImport {

  // If there was an error during import, this will contain that error
  // as a user-readable string.
  public error: string;

  // PendingImport if no matching account can be found.
  public pending: PendingImport = null;

  // List of successfully imported transactions
  public imported: Transaction[] = [];

  readonly events = {
    account_created: new EventSource<Account>(),
    account_linked: new EventSource<{
      label: string,
      account_id:number,
    }>(),
    imported: new EventSource<Transaction[]>(),
  }

  constructor(readonly store:IStore, readonly path:string) {

  }

  get done() {
    if (this.error || this.pending) {
      return false;
    } else {
      return true;
    }
  }

  async run() {
    // reset state
    this.error = null;
    this.pending = null;
    this.imported = [];

    // read file
    let data = await fs.readFileAsync(this.path, {encoding:'utf8'});

    // try ofx
    let parsed:ImportableTrans[];
    try {
      parsed = await ofx2importable(data);
    } catch(err) {
      this.error = err.toString();
      return;
    }

    // 
    if (parsed.length) {
      let account_label = parsed[0].account_label;
      let hash = hashStrings([account_label]);
      let rows = await this.store.query(`SELECT account_id FROM account_mapping WHERE account_hash=$hash`, {$hash: hash});
      if (rows.length === 1) {
        // matching account
        let account_id = rows[0].account_id;
        this.imported = await Promise.all(parsed.map(trans => {
          return this.store.accounts.importTransaction({
            account_id,
            amount: trans.amount,
            memo: trans.memo,
            posted: trans.posted,
            fi_id: trans.fi_id,
          })
        }));
        this.events.imported.emit(this.imported);
      } else {
        // no matching account
        this.pending = {
          transactions: parsed,
          account_label,
          hash,
        }
      }
    }
  }
  /**
   *  @param account_id  If "NEW" then a new account will be created.
   */
  async finish(account_id: number|'NEW') {
    let pending = this.pending;
    let numeric_account_id:number;

    if (account_id === 'NEW') {
      // Make a new account
      let new_account = await this.store.accounts.add(pending.account_label)
      account_id = new_account.id;
      numeric_account_id = new_account.id;
      await this.store.connections.linkAccountToHash(pending.hash, new_account.id);
      this.events.account_created.emit(new_account);
    } else {
      // Link to an existing account
      numeric_account_id = account_id;
      await this.store.connections.linkAccountToHash(pending.hash, account_id);
      this.events.account_linked.emit({label: pending.account_label, account_id})
    }
    
    this.imported = await Promise.all(pending.transactions.map(trans => {
      return this.store.accounts.importTransaction({
        account_id: numeric_account_id,
        amount: trans.amount,
        memo: trans.memo,
        posted: trans.posted,
        fi_id: trans.fi_id,
      })
    }));
    this.events.imported.emit(this.imported);
  }
}

export class FileImporter {
  constructor(readonly store:IStore) {

  }
  async createImport(path:string):Promise<FileImport> {
    let fileimport = new FileImport(this.store, path);
    await fileimport.run();
    return fileimport;
  }
}