import * as fs from 'fs-extra-promise'
import * as Path from 'path'

import { dialog } from 'electron'
import * as log from 'electron-log'

import { sss } from './i18n'
import { IStore } from './store'
import * as Bucket from './models/bucket'
import * as Account from './models/account'
import { decimal2cents } from './money'
import { ensureLocalMoment } from './time'

import { reportErrorToUser } from './errors'

function number2cents(n:number):number {
  return decimal2cents(n.toString());
}

namespace YNAB {
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
  interface CommonTransaction {
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
    cleared: "Cleared" | "Uncleared";
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
  }
  export interface SubTransaction extends CommonTransaction {
    parentTransactionId?: string;
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

export async function importYNAB4(store:IStore, path:string):Promise<null> {
  const ymeta = await loadJSONFile<YNAB.Meta>(Path.resolve(path, 'Budget.ymeta'));

  const datadir = Path.resolve(path, ymeta.relativeDataFolderName);
  const filenames = await fs.readdirAsync(datadir);

  if (filenames.length !== 2) {
    log.warn(`Unexpected files/dirs in YNAB budget: ${filenames}`)
  }

  const budget_dir = Path.resolve(path, ymeta.relativeDataFolderName, filenames.filter(x => x !== 'devices')[0])

  const budget = await loadJSONFile<YNAB.Budget>(Path.resolve(budget_dir, 'Budget.yfull'));

  let payees:{[k:string]: YNAB.Payee} = {};
  let yaccounts:{[k:string]: YNAB.Account} = {};
  let categories:{[k:string]: YNAB.SubCategory} = {};
  let masterCats:{[k:string]: YNAB.MasterCategory} = {};

  let groups = await store.buckets.listGroups();
  const group_names = groups.map(x => x.name);

  let buckets = await store.buckets.list();
  let cat2bucket:{[k:string]:Bucket.Bucket} = {};

  let accounts = await store.accounts.list();
  const account_names = accounts.map(x => x.name);
  let acc2acc:{[k:string]:Account.Account} = {};

  budget.payees.forEach(payee => {
    payees[payee.entityId] = payee;
  })

  // MasterCategories -> Bucket Groups
  for (let mcat of budget.masterCategories.sort(sortByIndex)) {
    masterCats[mcat.entityId] = mcat;
    let group_id:number;
    let idx = group_names.indexOf(mcat.name)
    if (mcat.entityId === "MasterCategory/__Hidden__") {
      // kicked bucket -- no group
    } else if (idx === -1) {
      // make a new group
      let group = await store.buckets.addGroup({name: mcat.name});
      group_id = group.id;
    } else {
      // use existing group
      group_id = groups[idx].id;
    }
    const bucket_names = buckets
      .filter(bucket => bucket.group_id === group_id)
      .map(x => x.name);

    // SubCategories -> Buckets
    for (let cat of mcat.subCategories.sort(sortByIndex)) {
      categories[cat.entityId] = cat;
      let idx = bucket_names.indexOf(cat.name);
      let bucket;
      if (idx === -1) {
        // make a new bucket
        bucket = await store.buckets.add({name: cat.name, group_id: group_id});
      } else {
        // use existing bucket
        bucket = buckets.filter(x => x.name === cat.name)[0];
      }
      cat2bucket[cat.entityId] = bucket;
      if (mcat.entityId === "MasterCategory/__Hidden__") {
        // hidden
        await store.buckets.kick(bucket.id);
      }
    }
  }

  // Account -> Account
  for (let yaccount of budget.accounts.sort(sortByIndex)) {
    yaccounts[yaccount.entityId] = yaccount;

    let idx = account_names.indexOf(yaccount.accountName);
    let account;
    if (idx === -1) {
      // make a new account
      account = await store.accounts.add(yaccount.accountName);
    } else {
      account = accounts.filter(x => x.name === yaccount.accountName)[0];
    }
    acc2acc[yaccount.entityId] = account;
  }

  // Transaction -> Transaction
  for (let ytrans of budget.transactions
      .sort((a, b) => {
        return compare(a.date, b.date);
      })) {
    if (ytrans.isTombstone) {
      continue;
    }
    let fi_id = ytrans.FITID || ytrans.YNABID || ytrans.entityId;

    let buckets_account = acc2acc[ytrans.accountId];
    let memo = ytrans.memo;
    if (!memo && ytrans.payeeId) {
      let payee = payees[ytrans.payeeId];
      memo = payee.name;
    }
    let trans = await store.accounts.importTransaction({
      account_id: buckets_account.id,
      amount: number2cents(ytrans.amount),
      memo,
      posted: ensureLocalMoment(ytrans.date),
      fi_id,
    })

    // Now categorize
    if (ytrans.categoryId === "Category/__ImmediateIncome__") {
      // Income
      await store.accounts.categorizeGeneral(trans.id, 'income');
    } else if (ytrans.categoryId === "Category/__Split__") {
      // Split category
      let cats = ytrans.subTransactions.map(sub => {
        let bucket_id = cat2bucket[sub.categoryId].id;
        let amount = number2cents(sub.amount);
        return {
          bucket_id,
          amount,
        }
      })
      await store.accounts.categorize(trans.id, cats);
    } else {
      // Single category
      let bucket = cat2bucket[ytrans.categoryId];
      if (bucket) {
        await store.accounts.categorize(trans.id, [{
          bucket_id: bucket.id,
          amount: trans.amount,
        }])
      }
    }
  }

  return null;
}

export async function findYNAB4FileAndImport(store:IStore):Promise<any> {
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      title: sss('Open YNAB4 File'),
      filters: [
        {
          name: 'YNAB',
          extensions: ['ynab4'],
        }
      ],
    }, async (paths) => {
      if (paths) {
        for (let path of paths) {
          try {
            await importYNAB4(store, path);  
          } catch(err) {
            log.error(err.stack);
            reportErrorToUser(sss('Error importing'), {err: err});
          }
        }
        resolve(null)
      } else {
        reject(null)
      }
    })
  });
}
