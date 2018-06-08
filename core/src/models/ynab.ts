import * as fs from 'fs-extra-promise'
import * as Path from 'path'
import {v4 as uuid} from 'uuid'

// import { dialog } from 'electron'

import * as sortby from 'lodash.sortby'
import { sss } from '@iffycan/i18n'
import { IStore } from '../store'
import * as Bucket from './bucket'
import * as Account from './account'
import { decimal2cents } from '../money'
import { parseLocalTime } from '../time'
// import { IBudgetFile } from './mainprocess/files'

// import { reportErrorToUser } from './errors'

import { PrefixLogger } from '../logging'

const log = new PrefixLogger('(ynab)')


//-------------------------------------------------------
// Database objects
//-------------------------------------------------------
declare module '../store' {
  interface ISubStore {
    ynab: YNABStore;
  }
  interface IStoreEvents {
    ynab_import_progress: {
      id: string;
      percent: number;
      error?: boolean;
    }
  }
}

function number2cents(n:number):number {
  return decimal2cents(n.toString());
}

export namespace YNAB {
  export interface Meta {
    formatVersion: string;
    relativeDataFolderName: string;
    TED: number;
  }
  export interface Budget {
    transactions: Transaction[];
    monthlyBudgets: MonthlyBudget[];
    accountMappings: AccountMapping[];
    budgetMetaData: {
      currencyISOSymbol: string;
      entityVersion: string; // "A-0",
      budgetType: string; // "Personal",
      dateLocale: string; // "en_US",
      strictBudget: string; // "TRUE",
      entityId: string; // "A2",
      entityType: "budgetMetaData";
      currencyLocale: string; // "en_US"
    }
    accounts: Account[];
    masterCategories: MasterCategory[];
    payees: Payee[];
  }
  export interface CommonTransaction {
    date: string;
    entityId: string;
    entityType: string;
    categoryId: string;
    isTombstone: boolean;
    entityVersion: string;
    amount: number;
    accountId: string;
    payeeId: string;
    memo?: string;
    cleared: "Cleared" | "Uncleared" | "Reconciled";
    accepted: boolean;
    flag?: string;
    importedPayee?: string; // "DIVIDEND EARNED FOR PERIOD OF 10",
    YNABID?: string; // "YNAB:0.18:2017-10-31:1",
    FITID?: string; // "0000778",
    source?: string; // "Imported",
  }
  export interface Transaction extends CommonTransaction {
    entityType: "transaction";
    subTransactions?: SubTransaction[];
    matchedTransactions?: Array<any>;
  }
  export interface SubTransaction extends CommonTransaction {
    parentTransactionId?: string;
    // transfer
    targetAccountId?: string;
    transferTransactionId?: string;
  }

  export interface MonthlyBudget {
    month: string; // "2017-10-01",
    monthlySubCategoryBudgets: MonthlySubCategoryBudget[],
    entityVersion: string; // "A-37",
    entityId: string; // "MB/2017-10",
    entityType: "monthlyBudget";
  }
  export interface MonthlySubCategoryBudget {
    budgeted: number; // 100,
    categoryId: string; // "A5",
    overspendingHandling: any; // null,
    entityVersion: string; // "A-79",
    entityId: string; // "MCB/2017-11/A5",
    parentMonthlyBudgetId: string; // "MB/2017-11",
    entityType: "monthlyCategoryBudget";
  }

  export interface Account {
    accountName: string; // "Checking",
    onBudget: boolean; // true,
    entityVersion: string; // "A-64",
    lastEnteredCheckNumber: number | string; // -1,
    hidden: boolean; // false,
    entityId: string; // "CD28E337-FEAE-BE04-BA2B-263EBA18DC51",
    lastReconciledDate: string; // null,
    sortableIndex: number; // 0,
    entityType: "account",
    accountType: string; // "Checking",
    lastReconciledBalance: number; // 0
  }

  export interface AccountMapping {
    fid: string; // "1001 ",
    shortenedAccountId: string;
    hash: string;
    salt: string;
    targetYNABAccountId: string; // "CD28E337-FEAE-BE04-BA2B-263EBA18DC51",
    skipImport: boolean; // false,
    entityVersion: string; // "A-124",
    dateSequence: null,
    shouldFlipPayeesMemos: boolean; // false,
    shouldImportMemos: boolean; // true,
    entityId: string; // "7AEB41B3-8CD6-A0AC-0FEC-83EFFF85B930",
    entityType: "accountMapping";
  }

  export interface MasterCategory {
    type: "OUTFLOW";
    deleteable: boolean; // false,
    name: string; // "Hidden Categories",
    subCategories: SubCategory[],
    entityVersion: string; // "A-1",
    entityId: string; // "MasterCategory/__Hidden__",
    expanded: boolean; // true,
    sortableIndex: number; // -1073741824,
    entityType: "masterCategory"
  }
  export interface SubCategory {
    type: "OUTFLOW";
    name: string; // "Tithing",
    cachedBalance: number; // 0,
    masterCategoryId: string; // "A4",
    entityVersion: string; // "A-3",
    entityId: string; // "A5",
    sortableIndex: number; // 0,
    entityType: "category";
  }

  export interface Payee {
    name: string;
    targetAccountId: string;
    enabled: boolean;
    entityVersion: string;
    entityId: string;
    entityType: "payee";
    autoFillCategoryId: string;
    autoFillAmount: number;
  }
}

export interface LeftoverTrans {
  trans: Account.Transaction;
  ynab: YNAB.Transaction;
}

export class YNABStore {
  private _loaded:boolean = false;
  private _waiting:Array<Function> = [];
  constructor(private store:IStore) {
    this._loadSchema()
  }
  private async _loadSchema() {
    log.info('Creating temporary schema')
    await this.store.query(`
      CREATE TEMPORARY TABLE IF NOT EXISTS ynab_leftover_trans (
        transaction_id INTEGER PRIMARY KEY,
        ynab_trans_json TEXT
      )`, {});
    this._waiting.forEach(func => {
      func(null)
    });
    this._loaded = true;
    log.info('Created temporary schema')
  }
  async ensureInit() {
    if (this._loaded) {
      return;
    }
    return new Promise<any>((resolve, reject) => {
      this._waiting.push(resolve);
    })
  }
  async addLeftoverTransaction(transaction_id:number, ynab_trans:YNAB.Transaction) {
    await this.ensureInit();
    await this.store.query(`
      INSERT OR REPLACE INTO ynab_leftover_trans
      (transaction_id, ynab_trans_json)
      VALUES ($trans_id, $ynab_trans_json)`, {
      $trans_id: transaction_id,
      $ynab_trans_json: JSON.stringify(ynab_trans),
    })
  }
  async listLeftoverTransactions():Promise<LeftoverTrans[]> {
    await this.ensureInit();
    let ret:{
      [trans_id:number]: LeftoverTrans;
    } = {};
    const transactions = await this.store.listObjects('account_transaction', {
      where: 'id IN (SELECT transaction_id FROM ynab_leftover_trans)',
    });
    transactions.forEach(trans => {
      ret[trans.id] = {trans: trans, ynab: null};
    })
    const rows = await this.store.query('SELECT * FROM ynab_leftover_trans', {})
    rows.forEach(({transaction_id, ynab_trans_json}) => {
      ret[transaction_id].ynab = JSON.parse(ynab_trans_json);
    })
    return Object.values(ret);
  }
}

async function loadJSONFile<T>(path:string):Promise<T> {
  const guts = await fs.readFileAsync(path)
  return JSON.parse(guts.toString('utf8')) as T;
}

function compare(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;
}
function sortByIndex(a, b) {
  return compare(a.sortableIndex, b.sortableIndex);
}

export async function importYNAB4(store:IStore, path:string) {
  const import_id = uuid();
  store.events.broadcast('ynab_import_progress', {
    id: import_id,
    percent: 0,
  })
  try {
    const ymeta = await loadJSONFile<YNAB.Meta>(Path.resolve(path, 'Budget.ymeta'));
    const datadir = Path.resolve(path, ymeta.relativeDataFolderName);
    const filenames = await fs.readdirAsync(datadir);

    if (filenames.length !== 2) {
      log.warn(`Unexpected files/dirs in YNAB budget: ${filenames}`)
    }

    let budget_files = filenames.filter(x => x !== 'devices')
      .map(x => {
        const this_path = Path.resolve(path, ymeta.relativeDataFolderName, x, 'Budget.yfull');
        let mtime;
        try {
          mtime = fs.statSync(this_path).mtime.getTime();  
        } catch(err) {
          return null;
        }
        return {
          path: this_path,
          mtime,
        }
      })
      .filter(x => x !== null)
    
    budget_files = sortby(budget_files, [x => -x.mtime])

    if (!budget_files.length) {
      throw new Error("No Budget.yfull found");
    }

    let budget:YNAB.Budget;
    if (budget_files.length > 1) {
      log.info("More than one Budget.yfull found.  Choosing the most recent of:", budget_files)
    }
    budget = await loadJSONFile<YNAB.Budget>(budget_files[0].path);

    let payees:{[k:string]: YNAB.Payee} = {};
    let yaccounts:{[k:string]: YNAB.Account} = {};
    let categories:{[k:string]: YNAB.SubCategory} = {};
    let masterCats:{[k:string]: YNAB.MasterCategory} = {};

    let groups = await store.sub.buckets.listGroups();
    const group_names = groups.map(x => x.name);

    let buckets = await store.sub.buckets.list();
    let cat2bucket:{[k:string]:Bucket.Bucket} = {};

    let accounts = await store.sub.accounts.list();
    const account_names = accounts.map(x => x.name);
    let acc2acc:{[k:string]:Account.Account} = {};

    budget.payees.forEach(payee => {
      payees[payee.entityId] = payee;
    })

    let ret:{
      transactions_worth_looking_at: Array<{
        transaction: Account.Transaction,
        ynabSubTransactions: Array<{
          amount: number;
          category: string;
        }>
      }>
    } = {
      transactions_worth_looking_at: [],
    }

    let monthly_budgets = budget.monthlyBudgets
      .filter(x => x.monthlySubCategoryBudgets.length)
      .sort((a,b) => compare(a.month, b.month))
    let deposit_amounts = {};
    let rain_transactions:{
      [k:string]: Array<{
        categoryId: string;
        rain: number;
        month: string;
      }>
    } = {};
    for (let month of monthly_budgets) {
      month.monthlySubCategoryBudgets.forEach(sub => {
        deposit_amounts[sub.categoryId] = number2cents(sub.budgeted);
        if (!rain_transactions[sub.categoryId]) {
          rain_transactions[sub.categoryId] = [];
        }
        let this_rain = rain_transactions[sub.categoryId];
        this_rain.push({
          categoryId: sub.categoryId,
          rain: number2cents(sub.budgeted),
          month: month.month,
        })
      })
    }

    // MasterCategories -> Bucket Groups
    for (let mcat of budget.masterCategories.sort(sortByIndex)) {
      masterCats[mcat.entityId] = mcat;
      let group_id:number;
      let idx = group_names.indexOf(mcat.name)
      if (mcat.entityId === "MasterCategory/__Hidden__") {
        // kicked bucket -- no group
      } else if (idx === -1) {
        // make a new group
        let group = await store.sub.buckets.addGroup({name: mcat.name});
        group_id = group.id;
      } else {
        // use existing group
        group_id = groups[idx].id;
      }
      const bucket_names = buckets
        .filter(bucket => bucket.group_id === group_id)
        .map(x => x.name);

      // SubCategories -> Buckets
      if (!mcat.subCategories) {
        log.info('no subcategories', mcat.entityId, mcat.entityType, mcat.entityVersion, mcat.name)
        continue;
      }
      for (let cat of mcat.subCategories.sort(sortByIndex)) {
        log.info('subCategory', cat.entityId, cat.entityType, cat.entityVersion, cat.type, cat.name);
        categories[cat.entityId] = cat;
        let idx = bucket_names.indexOf(cat.name);
        let bucket:Bucket.Bucket;
        if (idx === -1) {
          // make a new bucket
          bucket = await store.sub.buckets.add({name: cat.name, group_id: group_id});
        } else {
          // use existing bucket
          bucket = buckets.filter(x => x.name === cat.name)[0];
        }
        log.info(`cat2bucket[${cat.entityId}] = ${bucket.name}`);
        cat2bucket[cat.entityId] = bucket;

        // Set up deposit amount
        let deposit_amount = deposit_amounts[cat.entityId]
        if (!bucket.deposit && bucket.kind === '' && deposit_amount) {
          await store.sub.buckets.update(bucket.id, {
            kind: 'deposit',
            deposit: deposit_amount,
          })
        }

        // Record prior rain
        let transactions = rain_transactions[cat.entityId];
        if (transactions) {
          for (let trans of transactions) {
            await store.sub.buckets.transact({
              bucket_id: bucket.id,
              amount: trans.rain,
              memo: 'Rain',
              posted: parseLocalTime(trans.month),
            })
          }
        }

        if (mcat.entityId === "MasterCategory/__Hidden__") {
          // hidden
          await store.sub.buckets.kick(bucket.id);
        }
      }
    }

    // Account -> Account
    if (budget.accounts) {
      for (let yaccount of budget.accounts.sort(sortByIndex)) {
        yaccounts[yaccount.entityId] = yaccount;

        let idx = account_names.indexOf(yaccount.accountName);
        let account;
        if (idx === -1) {
          // make a new account
          account = await store.sub.accounts.add(yaccount.accountName);
        } else {
          account = accounts.filter(x => x.name === yaccount.accountName)[0];
        }
        acc2acc[yaccount.entityId] = account;
      }  
    }
    
    async function addTransWorthLookingAt(trans:Account.Transaction, ynabTrans:YNAB.Transaction) {
      await store.sub.ynab.addLeftoverTransaction(trans.id, ynabTrans);
      ret.transactions_worth_looking_at.push({
        transaction: trans,
        ynabSubTransactions: ynabTrans.subTransactions.map(sub => {
          return {
            category: sub.categoryId && categories[sub.categoryId] ? categories[sub.categoryId].name : sub.categoryId || sss('Unknown category'),
            amount: number2cents(sub.amount),
          }
        })
      });
    }

    let done_count = 0;
    let total_transactions = 1;
    function markTransactionDone() {
      done_count++;
      if (done_count % 100 === 0) {
        log.info('completed importing', done_count);
        store.events.broadcast('ynab_import_progress', {
          id: import_id,
          percent: done_count/total_transactions,
        })
      }
    }

    async function processTransaction(ytrans:YNAB.Transaction) {
      let fi_id = ytrans.FITID || ytrans.YNABID || ytrans.entityId;
      let buckets_account = acc2acc[ytrans.accountId];
      let memo = ytrans.memo;
      if (!memo && ytrans.payeeId) {
        let payee = payees[ytrans.payeeId];
        memo = payee.name;
      }
      let { transaction } = await store.sub.accounts.importTransaction({
        account_id: buckets_account.id,
        amount: number2cents(ytrans.amount),
        memo,
        posted: parseLocalTime(ytrans.date),
        fi_id,
      })

      // Now categorize
      try {
        if (ytrans.categoryId === "Category/__ImmediateIncome__") {
          // Income
          await store.sub.accounts.categorizeGeneral(transaction.id, 'income');
        } else if (ytrans.categoryId === "Category/__Split__") {
          // Split category
          const nullCatCount = ytrans.subTransactions.filter(sub => !cat2bucket[sub.categoryId]).length;
          if (nullCatCount) {
            // It's not completely categorized or it's split between income and another category
            await addTransWorthLookingAt(transaction, ytrans);
          } else {
            let cats = ytrans.subTransactions.map(sub => {
              let bucket_id = cat2bucket[sub.categoryId].id;
              let amount = number2cents(sub.amount);
              return {
                bucket_id,
                amount,
              }
            })
            try {
              await store.sub.accounts.categorize(transaction.id, cats);  
            } catch(err) {
              if (err instanceof Account.SignMismatch) {
                await addTransWorthLookingAt(transaction, ytrans);
              } else if (err instanceof Account.SumMismatch) {
                await addTransWorthLookingAt(transaction, ytrans);
              } else {
                throw err;
              }
            }
            
          }
        } else {
          // Single category
          let bucket = cat2bucket[ytrans.categoryId];
          if (bucket) {
            await store.sub.accounts.categorize(transaction.id, [{
              bucket_id: bucket.id,
              amount: transaction.amount,
            }])
          }
        }
      } catch(err) {
        log.error(err);
        log.info(`ytrans: ${JSON.stringify(ytrans)}`);
        throw err;
      } finally {
        markTransactionDone();
      }
    }
    // Transaction -> Transaction
    if (budget.transactions) {
      total_transactions = budget.transactions.length;
      for (let ytrans of budget.transactions
          .sort((a, b) => {
            return compare(a.date, b.date);
          })) {
        if (ytrans.isTombstone) {
          markTransactionDone();
          continue;
        }
        await processTransaction(ytrans);
      }
    }
    log.info('done with import');
    store.events.broadcast('ynab_import_progress', {
      id: import_id,
      percent: 1,
    })
    return ret;
  } catch(err) {
    store.events.broadcast('ynab_import_progress', {
      id: import_id,
      percent: 0,
      error: true,
    })
    throw err;
  }
}

// XXX TODO
// export async function findYNAB4FileAndImport(current_file:IBudgetFile, store:IStore):Promise<any> {
//   return new Promise((resolve, reject) => {
//     dialog.showOpenDialog({
//       title: sss('Open YNAB4 File'),
//       properties: ['openFile', 'openDirectory'],
//       filters: [
//         {
//           name: 'YNAB',
//           extensions: ['ynab4'],
//         }
//       ],
//     }, async (paths) => {
//       if (paths) {
//         for (let path of paths) {
//           try {
//             await importYNAB4(current_file, store, path);
//           } catch(err) {
//             log.error(err.stack);
//             reportErrorToUser(sss('Error importing'), {err: err});
//           }
//         }
//         resolve(null)
//       } else {
//         reject(null)
//       }
//     })
//   });
// }
