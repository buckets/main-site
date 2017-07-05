import * as moment from 'moment'
import * as _ from 'lodash'

import {EventEmitter} from 'events'
import {isObj, ObjectEvent, IStore} from '../store'
import {Account, Transaction as ATrans} from '../models/account'
import {Bucket, Group} from '../models/bucket'
import {isBetween} from '../time'
import {Balances} from '../models/balances'

interface IAppState {
  accounts: {
    [k: number]: Account;
  };
  groups: {
    [k: number]: Group;
  };
  buckets: {
    [k: number]: Bucket;
  };
  transactions: {
    [k: number]: ATrans;
  };
  account_balances: Balances;
  bucket_balances: Balances;
  month: number;
  year: number;
}

interface IComputedAppState {
  rain: number;
  bucket_total_balance: number;
  account_total_balance: number;
  transfers_in: number;
  transfers_out: number;
  income: number;
  expenses: number;
  gain: number;
}

export class AppState implements IAppState, IComputedAppState {
  accounts = {};
  buckets = {};
  groups = {};
  transactions = {};
  account_balances = {};
  bucket_balances = {};
  month = null;
  year = null;

  rain: number = 0;
  bucket_total_balance: number = 0;
  account_total_balance: number = 0;
  transfers_in: number = 0;
  transfers_out: number = 0;
  income: number = 0;
  expenses: number = 0;
  gain: number = 0;

  get defaultPostingDate() {
    let today = moment();
    let d = moment(`${this.year}-${this.month}-1`, 'YYYY-MM-DD');
    if (d.month() == today.month() && d.year() == today.year()) {
      d = today;
    } else if (d < today) {
      d = d.endOf('month').startOf('day');
    } else {
      d = d.startOf('month').startOf('day');
    }
    d = d.utc();
    return d.utc();
  }
  get viewDateRange():{onOrAfter:moment.Moment, before:moment.Moment} {
    let d = moment(`${this.year}-${this.month}-1`, 'YYYY-MM-DD');
    let start = d.startOf('month').startOf('day');
    let end = start.clone().add(1, 'month').startOf('month').startOf('day');
    return {
      onOrAfter: start,
      before: end,
    }
  }
}

function computeTotals(appstate:AppState):IComputedAppState {
  let bucket_total_balance = _.values(appstate.bucket_balances)
    .reduce((a,b) => a+b, 0);
  let account_total_balance = _.values(appstate.account_balances)
    .reduce((a,b) => a+b, 0);
  let income = 0;
  let expenses = 0;
  let transfers_in = 0;
  let transfers_out = 0;
  _.values(appstate.transactions)
  .forEach((trans:ATrans) => {
    if (trans.general_cat === 'transfer') {
      if (trans.amount > 0) {
        transfers_in += trans.amount;
      } else {
        transfers_out += trans.amount;
      }
    } else {
      if (trans.amount > 0) {
        income += trans.amount;
      } else {
        expenses += trans.amount;
      }
    }
  })
  let rain = account_total_balance - bucket_total_balance;
  let gain = income + expenses;
  return {
    bucket_total_balance,
    account_total_balance,
    rain,
    transfers_in,
    transfers_out,
    income,
    expenses,
    gain,
  };
}

export class StateManager extends EventEmitter {
  public store:IStore;
  public appstate:AppState;
  constructor() {
    super()
    this.appstate = new AppState();
    this.store = null;
  }
  setStore(store: IStore) {
    this.store = store;
  }
  async processEvent(ev:ObjectEvent<any>):Promise<AppState> {
    let obj = ev.obj;
    let changed = false;
    if (isObj(Account, obj)) {
      if (ev.event === 'update') {
        this.appstate.accounts[obj.id] = obj;
        await this.fetchAccountBalances();
        changed = true;
      } else if (ev.event === 'delete') {
        delete this.appstate.accounts[obj.id];
        changed = true;
      }
    } else if (isObj(Bucket, obj)) {
      if (ev.event === 'update') {
        this.appstate.buckets[obj.id] = obj;
        await this.fetchBucketBalances();
        changed = true;
      } else if (ev.event === 'delete') {
        delete this.appstate.buckets[obj.id];
        changed = true;
      }
    } else if (isObj(ATrans, obj)) {
      let dr = this.appstate.viewDateRange;
      if (isBetween(obj.posted, dr.onOrAfter, dr.before)) {
        if (ev.event === 'update') {
          this.appstate.transactions[obj.id] = obj;
          changed = true;
        } else if (ev.event === 'delete') {
          delete this.appstate.transactions[obj.id];
          changed = true;
        }
      }
    }
    if (changed) {
      this.recomputeTotals();
      this.emit('change', this.appstate);
    }
    return this.appstate;
  }
  async setDate(year:number, month:number):Promise<any> {
    if (this.appstate.year !== year || this.appstate.month !== month) {
      this.appstate.year = year;
      this.appstate.month = month;
      await this.refresh();
      this.emit('change', this.appstate);
    }
  }
  async refresh():Promise<any> {
    await Promise.all([
      this.fetchAllAccounts(),
      this.fetchAllBuckets(),
      this.fetchAccountBalances(),
      this.fetchBucketBalances(),
      this.fetchTransactions(),
    ])
    this.recomputeTotals();
    return this;
  }
  recomputeTotals() {
    console.log('recomputeTotals');
    let totals = computeTotals(this.appstate);
    Object.assign(this.appstate, totals);
  }
  fetchAllAccounts() {
    return this.store.accounts.list()
      .then(accounts => {
        this.appstate.accounts = {};
        accounts.forEach(account => {
          this.appstate.accounts[account.id] = account;
        })
      })
  }
  fetchAccountBalances() {
    return this.store.accounts.balances(this.appstate.viewDateRange.before)
      .then(balances => {
        this.appstate.account_balances = balances;
      })
  }
  fetchAllBuckets() {
    return this.store.buckets.list()
      .then(buckets => {
        this.appstate.buckets = {};
        buckets.forEach(bucket => {
          this.appstate.buckets[bucket.id] = bucket;
        })
      })
  }
  fetchBucketBalances() {
    return this.store.buckets.balances(this.appstate.viewDateRange.before)
      .then(balances => {
        this.appstate.bucket_balances = balances;
      })  
  }
  fetchTransactions() {
    let range = this.appstate.viewDateRange;
    return this.store.accounts.listTransactions({
      posted: {
        onOrAfter: range.onOrAfter,
        before: range.before,
      }
    })
      .then(transactions => {
        this.appstate.transactions = {};
        transactions.forEach(trans => {
          this.appstate.transactions[trans.id] = trans;
        })
      })
  }
}

export const manager = new StateManager();
