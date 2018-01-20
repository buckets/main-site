import * as fs from 'fs-extra-promise'

import { sss } from './i18n'
import { Transaction, AccountMapping } from './models/account'
import { ofx2importable } from './ofx'
import { csv2importable } from './csvimport'
import { IStore } from './store'
import { isNil, hashStrings } from './util'
import { IBudgetFile } from './mainprocess/files'
import { displayError } from './errors'
import { PrefixLogger } from './logging'
import { ensureLocalMoment, Timestamp } from './time'

const log = new PrefixLogger('(importing)');

export interface ImportableAccountSet {
  accounts: ImportableAccount[];
}
export interface ImportableAccount {
  label?: string;
  transactions: ImportableTrans[];
  currency?:string;
  account_id?: number;
}
export interface ImportableTrans {
  amount: number;
  memo: string;
  posted: Timestamp;
  fi_id?: string;
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
export async function importFile(store:IStore, bf:IBudgetFile, path:string):Promise<ImportResult> {
  log.silly('importFile', path);
  let set:ImportableAccountSet;
  
  let data = await fs.readFileAsync(path, {encoding:'utf8'});
  log.silly('read data', data.length);
  try {
    log.silly('Trying OFX/QFX parser');
    set = await ofx2importable(data);
  } catch(err) {
    log.debug('Error reading file as OFX');
    log.debug(err);
  }

  if (!set && path.toLowerCase().endsWith('.csv')) {
    log.silly('Trying CSV parser');
    try {
      set = await csv2importable(store, bf, data);
    } catch(err) {
      log.debug('Error reading file as CSV');
      log.debug(err);
    }
  }

  if (!set) {
    log.warn('Unrecognized import file type', path);
    displayError(sss('File type not recognized.', 'Import Failed'));
    return;
  }
  // The file has been parsed, can we match it up with 

  let imported:Transaction[] = [];
  let pendings:PendingImport[] = [];

  for (let account of set.accounts) {
    let account_id;
    let hash;
    if (isNil(account.account_id)) {
      hash = hashStrings([account.label]);
      account_id = await store.accounts.hashToAccountId(hash);  
    } else {
      account_id = account.account_id;
    }
    
    if (account_id) {
      // matching account
      let results = await store.accounts.importTransactions(account.transactions.map(trans => {
          return {
            account_id,
            amount: trans.amount,
            memo: trans.memo,
            posted: ensureLocalMoment(trans.posted),
            fi_id: trans.fi_id,
          }
        })
      )
      imported = imported.concat(results.transactions);
    } else if (hash) {
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


