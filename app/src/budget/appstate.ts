import * as moment from 'moment'
import * as _ from 'lodash'

import { EventSource } from '../events'
import {isObj, ObjectEvent, IStore} from '../store'
import { Account, UnknownAccount, expectedBalance, Transaction as ATrans} from '../models/account'
import {Bucket, Group, Transaction as BTrans} from '../models/bucket'
import { Connection } from '../models/simplefin'
import { isBetween, ensureLocalMoment } from '../time'
import {Balances} from '../models/balances'
import { BankMacro } from '../models/bankmacro'
import { makeToast } from './toast'
import { sss } from '../i18n'
import { IBudgetFile } from '../mainprocess/files'
import { PrefixLogger } from '../logging'

const log = new PrefixLogger('(appstate)')


interface IComputedAppState {
  rain: number;
  bucket_total_balance: number;
  account_total_balance: number;
  transfers_in: number;
  transfers_out: number;
  income: number;
  expenses: number;
  gain: number;
  nodebt_balances: Balances;

  num_unknowns: number;
  unmatched_account_balances: number;
  num_uncategorized_trans: number;
  uncategorized_trans: ATrans[];

  unkicked_buckets: Bucket[];
  kicked_buckets: Bucket[];

  open_accounts: Account[];
  closed_accounts: Account[];

  can_sync: boolean;
}

export class AppState implements IComputedAppState {
  accounts: {
    [k: number]: Account;
  } = {};
  transactions: {
    [k: number]: ATrans;
  } = {};
  groups: {
    [k: number]: Group;
  } = {};
  buckets: {
    [k: number]: Bucket;
  } = {};
  btransactions: {
    [k: number]: BTrans;
  } = {};
  sfinconnections: {
    [k: number]: Connection;
  } = {};
  unknown_accounts: {
    [k: number]: UnknownAccount;
  } = {};
  bank_macros: {
    [k: number]: BankMacro;
  } = {};
  running_bank_macros = new Set<number>();
  account_balances: Balances = {};
  bucket_balances: Balances = {};
  nodebt_balances: Balances = {};

  // The rain each bucket has received this month.
  rainfall: Balances = {};
  month: number = null;
  year: number = null;

  syncing: number = 0;

  // The computed rain for this month.
  rain: number = 0;
  bucket_total_balance: number = 0;
  account_total_balance: number = 0;
  transfers_in: number = 0;
  transfers_out: number = 0;
  income: number = 0;
  expenses: number = 0;
  gain: number = 0;

  num_unknowns: number = 0;
  unmatched_account_balances: number = 0;
  num_uncategorized_trans: number = 0;
  uncategorized_trans: ATrans[] = [];

  unkicked_buckets: Bucket[] = [];
  kicked_buckets: Bucket[] = [];

  open_accounts: Account[] = [];
  closed_accounts: Account[] = [];

  can_sync = false;

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
  let bucket_neg_balance = 0;
  let bucket_pos_balance = 0;
  Object.values(appstate.bucket_balances)
    .forEach(bal => {
      if (bal <= 0) {
        bucket_neg_balance += bal;
      } else {
        bucket_pos_balance += bal;
      }
    })
  let bucket_total_balance = bucket_pos_balance + bucket_neg_balance;
  let account_total_balance = Object.values(appstate.account_balances)
    .reduce((a,b) => a+b, 0);
  let income = 0;
  let expenses = 0;
  let transfers_in = 0;
  let transfers_out = 0;
  let trans_with_buckets = {};
  Object.values(appstate.btransactions)
  .forEach((btrans:BTrans) => {
    trans_with_buckets[btrans.account_trans_id] = true;
  })
  let uncategorized_trans = [];
  let num_uncategorized_trans = 0;
  Object.values(appstate.transactions)
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
      if (!trans.general_cat && !trans_with_buckets[trans.id]) {
        num_uncategorized_trans += 1;
        uncategorized_trans.push(trans);
      }
    }
  })
  let rain = account_total_balance - bucket_total_balance;
  let gain = income + expenses;
  let num_unknowns = _.values(appstate.unknown_accounts).length;

  let kicked_buckets = [];
  let unkicked_buckets = [];
  let nodebt_balances = {};
  Object.values<Bucket>(appstate.buckets).forEach(bucket => {
    if (bucket.kicked) {
      kicked_buckets.push(bucket);
    } else {
      unkicked_buckets.push(bucket);
      let bal = appstate.bucket_balances[bucket.id];
      if (bal <= 0) {
        // negative
        nodebt_balances[bucket.id] = 0;
      } else {
        // positive
        nodebt_balances[bucket.id] = (bal / bucket_pos_balance) * bucket_total_balance;
      }
    }
  })
  let unmatched_account_balances = 0;
  let open_accounts = [];
  let closed_accounts = [];
  Object.values<Account>(appstate.accounts).forEach(account => {
    if (account.closed) {
      closed_accounts.push(account);
    } else {
      open_accounts.push(account);
      if (expectedBalance(account) !== account.balance) {
        unmatched_account_balances += 1;
      }  
    }
  })
  let can_sync = 
      !!Object.keys(appstate.sfinconnections).length
    ||!!Object.keys(appstate.bank_macros).length;
  return {
    bucket_total_balance,
    account_total_balance,
    rain,
    transfers_in,
    transfers_out,
    income,
    expenses,
    gain,
    num_unknowns,
    num_uncategorized_trans,
    uncategorized_trans,
    kicked_buckets,
    unkicked_buckets,
    open_accounts,
    closed_accounts,
    unmatched_account_balances,
    nodebt_balances,
    can_sync,
  };
}


class DelayingCounter {
  readonly done = new EventSource<number>();
  private _count = 0;
  private _timer;
  constructor(private delay:number=200) {}
  add(num:number=1) {
    this._count++;
    if (this._timer) {
      // restart the timer
      clearTimeout(this._timer);
    }
    this._timer = setTimeout(() => {
      let count = this._count;
      this.done.emit(count)
      this._count = 0;
    }, this.delay);
  }
}


export class StateManager {
  public store:IStore;

  public appstate:AppState;
  private queue: ObjectEvent<any>[] = [];
  private posttick: Set<string> = new Set();

  private updated_trans_counter = new DelayingCounter();

  public events = {
    obj: new EventSource<ObjectEvent<any>>(),
    change: new EventSource<AppState>(),
  }

  constructor() {
    this.appstate = new AppState();
    this.store = null;
    this.updated_trans_counter.done.on(count => {
      if (count > 1) {
        makeToast(sss('toast.updated-trans', count => `Updated/created ${count} transactions`)(count));  
      }
    })
  }
  attach(store: IStore, file:IBudgetFile) {
    this.store = store;

    // Syncing events
    file.room.events('sync_started').on(message => {
      let onOrAfter = ensureLocalMoment(message.onOrAfter);
      let before = ensureLocalMoment(message.before);
      makeToast(sss('sync.toast.syncing', (start:moment.Moment, end:moment.Moment) => {
        return `Syncing transactions from ${start.format('ll')} to ${end.format('ll')}`;
      })(onOrAfter, before));
      this.appstate.syncing++;
      this.signalChange();
    })
    file.room.events('sync_done').on(message => {
      let { result } = message;
      let onOrAfter = ensureLocalMoment(message.onOrAfter);
      let before = ensureLocalMoment(message.before);
      log.info('Sync done', onOrAfter.format(), before.format(), 'errors:', result.errors.length, 'trans:', result.imported_count);
      this.appstate.syncing--;
      if (result.errors.length) {
        result.errors.forEach(err => {
          log.warn('Error during sync:', err);
          makeToast(err.toString(), {className:'error'})
        })  
      } else {
        makeToast(sss('Sync complete'));  
      }
      this.signalChange();
    })

    // Macro playback events
    file.room.events('macro_started').on(message => {
      this.appstate.running_bank_macros.add(message.id);
      this.signalChange();
    })
    file.room.events('macro_stopped').on(message => {
      this.appstate.running_bank_macros.delete(message.id);
      this.signalChange();
    })
  }
  async processEvent(ev:ObjectEvent<any>):Promise<AppState> {
    this.queue.push(ev);
    this.events.obj.emit(ev);
    return this.tick();
  }
  async tick():Promise<AppState> {
    if (!this.queue.length) {
      return this.appstate;
    }
    let ev = this.queue.shift();
    let obj = ev.obj;
    if (isObj(Account, obj)) {
      if (ev.event === 'update') {
        if (!this.appstate.accounts[obj.id]) {
          makeToast(sss('Account created: ') + obj.name);
        }
        this.appstate.accounts[obj.id] = obj;
        this.posttick.add('fetchAccountBalances');
      } else if (ev.event === 'delete') {
        delete this.appstate.accounts[obj.id];
      }
    } else if (isObj(Bucket, obj)) {
      if (ev.event === 'update') {
        this.appstate.buckets[obj.id] = obj;
        this.posttick.add('fetchBucketBalances');
        this.posttick.add('fetchRainfall');
      } else if (ev.event === 'delete') {
        delete this.appstate.buckets[obj.id];
      }
    } else if (isObj(Group, obj)) {
      if (ev.event === 'update') {
        this.appstate.groups[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.groups[obj.id];
      }
    } else if (isObj(ATrans, obj)) {
      if (ev.event === 'update') {
        this.updated_trans_counter.add();
      }
      let dr = this.appstate.viewDateRange;
      let inrange = isBetween(obj.posted, dr.onOrAfter, dr.before)
      if (!inrange || ev.event === 'delete') {
        if (this.appstate.transactions[obj.id]) {
          delete this.appstate.transactions[obj.id];  
        }
      } else if (ev.event === 'update') {
        this.appstate.transactions[obj.id] = obj;
      }
    } else if (isObj(BTrans, obj)) {
      let dr = this.appstate.viewDateRange;
      let inrange = isBetween(obj.posted, dr.onOrAfter, dr.before)
      if (!inrange || ev.event === 'delete') {
        if (this.appstate.btransactions[obj.id]) {
          delete this.appstate.btransactions[obj.id];  
        }
      } else if (ev.event === 'update') {
        this.appstate.btransactions[obj.id] = obj;
      }
    } else if (isObj(Connection, obj)) {
      if (ev.event === 'update') {
        this.appstate.sfinconnections[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.sfinconnections[obj.id];
      }
    } else if (isObj(UnknownAccount, obj)) {
      if (ev.event === 'update') {
        if (!this.appstate.unknown_accounts[obj.id]) {
          makeToast(sss('Unknown account: ') + obj.description);
        }
        this.appstate.unknown_accounts[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.unknown_accounts[obj.id];
      }
    } else if (isObj(BankMacro, obj)) {
      if (ev.event === 'update') {
        this.appstate.bank_macros[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.bank_macros[obj.id];
      }
    }
    this.signalChange();
    return this.appstate;
  }
  
  signalChange = _.debounce(async () => {
    let posttick = Array.from(this.posttick.values());
    this.posttick.clear();
    await Promise.all(posttick.map(funcname => {
      return this[funcname]();
    }));
    this.recomputeTotals();
    this.events.change.emit(this.appstate);
  }, 50, {leading: true, trailing: true});

  async setDate(year:number, month:number):Promise<any> {
    if (this.appstate.year !== year || this.appstate.month !== month) {
      this.appstate.year = year;
      this.appstate.month = month;
      await this.refresh();
      this.events.change.emit(this.appstate);
    }
  }
  async refresh():Promise<any> {
    await Promise.all([
      this.fetchAllAccounts(),
      this.fetchAllBuckets(),
      this.fetchAllGroups(),
      this.fetchAccountBalances(),
      this.fetchBucketBalances(),
      this.fetchRainfall(),
      this.fetchTransactions(),
      this.fetchBucketTransactions(),
      this.fetchConnections(),
      this.fetchUnknownAccounts(),
      this.fetchBankMacros(),
    ])
    this.recomputeTotals();
    return this;
  }
  recomputeTotals() {
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
  fetchAllGroups() {
    return this.store.buckets.listGroups()
      .then(groups => {
        this.appstate.groups = {}
        groups.forEach(group => {
          this.appstate.groups[group.id] = group;
        })
      })
  }
  fetchBucketBalances() {
    return this.store.buckets.balances(this.appstate.viewDateRange.before)
      .then(balances => {
        this.appstate.bucket_balances = balances;
      })  
  }
  fetchRainfall() {
    return this.store.buckets.rainfall(
      this.appstate.viewDateRange.onOrAfter,
      this.appstate.viewDateRange.before)
      .then(rainfall => {
        this.appstate.rainfall = rainfall;
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
  fetchBucketTransactions() {
    let range = this.appstate.viewDateRange;
    return this.store.buckets.listTransactions({
      posted: {
        onOrAfter: range.onOrAfter,
        before: range.before,
      }
    })
      .then(transactions => {
        this.appstate.btransactions = {};
        transactions.forEach(trans => {
          this.appstate.btransactions[trans.id] = trans;
        })
      })
  }
  fetchConnections() {
    return this.store.simplefin.listConnections()
    .then(connections => {
      this.appstate.sfinconnections = {};
      connections.forEach(obj => {
        this.appstate.sfinconnections[obj.id] = obj;
      })
    })
  }
  fetchUnknownAccounts() {
    return this.store.listObjects(UnknownAccount)
    .then(accounts => {
      this.appstate.unknown_accounts = {};
      accounts.forEach(obj => {
        this.appstate.unknown_accounts[obj.id] = obj;
      })
    })
  }
  fetchBankMacros() {
    return this.store.listObjects(BankMacro)
    .then(macros => {
      this.appstate.bank_macros = {};
      macros.forEach(obj => {
        this.appstate.bank_macros[obj.id] = obj;
      })
    })
  }
}

export const manager = new StateManager();
