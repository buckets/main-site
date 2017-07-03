import * as moment from 'moment'

import {EventEmitter} from 'events'
import {isObj, ObjectEvent, IStore} from '../store'
import {Account, Transaction as ATrans} from '../models/account'
import {Bucket} from '../models/bucket'
import {isBetween} from '../time'
import {Balances} from '../models/balances'

interface IAppState {
  accounts: {
    [k: number]: Account;
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

export class AppState implements IAppState {
  accounts = {};
  buckets = {};
  transactions = {};
  account_balances = {};
  bucket_balances = {};
  month = null;
  year = null;

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
  refresh():Promise<any> {
    return Promise.all([
      this.fetchAllAccounts(),
      this.fetchAllBuckets(),
      this.fetchAccountBalances(),
      this.fetchTransactions(),
    ])
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
        console.log('fetched Transactions', transactions);
        transactions.forEach(trans => {
          this.appstate.transactions[trans.id] = trans;
        })
      })
  }
}

export const manager = new StateManager();
