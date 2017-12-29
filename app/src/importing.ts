import * as fs from 'fs-extra-promise'
import * as moment from 'moment'
import * as crypto from 'crypto'

import { Transaction, AccountMapping } from './models/account'
import { ofx2importable } from './ofx'
import { IStore } from './store'

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
export interface ImportResult {
  imported: Transaction[];
  pendings: PendingImport[];
}


/**
 *  Read and import data from a transaction file into the store.
 *
 *  If the import can't be completed because a matching account
 *  can't be found, then creating an AccountMapping will
 *  automatically finish the import.
 */
export async function importFile(store:IStore, path:string):Promise<ImportResult> {
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
    let account_id = await store.accounts.hashToAccountId(hash);
    if (account_id) {
      // matching account
      let results = await store.accounts.importTransactions(account.transactions.map(trans => {
          return {
            account_id,
            amount: trans.amount,
            memo: trans.memo,
            posted: trans.posted,
            fi_id: trans.fi_id,
          }
        })
      )
      imported = imported.concat(results.transactions);
    } else {
      // no matching account
      await store.accounts.getOrCreateUnknownAccount({
        description: account.label,
        account_hash: hash,
      });

      // wait for the account to be linked or ignored and then import it
      store.bus.obj.onceSuccessfully(async message => {
        if (message.event === 'update' && message.obj._type === 'account_mapping') {
          let mapping = message.obj as AccountMapping;
          if (mapping.account_hash === hash) {
            await store.accounts.importTransactions(account.transactions.map(trans => {
                return {
                  account_id: mapping.account_id,
                  amount: trans.amount,
                  memo: trans.memo,
                  posted: trans.posted,
                  fi_id: trans.fi_id,
                }
              })
            );
            // successfully imported; stop listening
            return true;
          }
        }
        // keep listening
        return false;
      })
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


