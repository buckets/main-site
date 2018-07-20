import * as moment from 'moment-timezone'
import * as _ from 'lodash'

import { EventSource } from '@iffycan/events'
import {isObj, IStore, IObjectEvent} from 'buckets-core/dist/store'
import { Account, UnknownAccount, expectedBalance, Transaction as ATrans, Category } from 'buckets-core/dist/models/account'
import {Bucket, Group, Transaction as BTrans, BucketFlow, BucketFlowMap, emptyFlow } from 'buckets-core/dist/models/bucket'
import { Connection } from 'buckets-core/dist/models/simplefin'
import { isBetween, loadTS, parseLocalTime, localNow, makeLocalDate } from 'buckets-core/dist/time'
import {Balances} from 'buckets-core/dist/models/balances'
import { BankMacro } from 'buckets-core/dist/models/bankmacro'
import { ISettings, DEFAULTS as DefaultSettings } from 'buckets-core/dist/models/settings'
import { makeToast } from './toast'
import { sss } from '../i18n'
import { PrefixLogger } from '../logging'
import { CSVNeedsMapping, CSVNeedsAccountAssigned } from '../csvimport'
import { setDefaultSymbol } from '../money'

const log = new PrefixLogger('(appstate)')


interface IComputedAppState {
  // The total current rain for the current time period
  rain: number;
  // Amount of THIS MONTH'S rain being used in the future
  rain_used_in_future: number;

  bucket_total_balance: number;
  open_accounts_balance: number;

  all_accounts_assets: number;
  all_accounts_debt: number;
  transfers_in: number;
  transfers_out: number;
  income: number;
  expenses: number;
  gain: number;

  num_unknowns: number;
  unmatched_account_balances: number;
  num_uncategorized_trans: number;
  uncategorized_trans: ATrans[];

  unkicked_buckets: Bucket[];
  kicked_buckets: Bucket[];

  open_accounts: Account[];
  closed_accounts: Account[];
  offbudget_accounts: Account[];

  can_sync: boolean;
}

export class AppState implements IComputedAppState {
  settings: ISettings = DefaultSettings;
  accounts: {
    [k: number]: Account;
  } = {};
  transactions: {
    [k: number]: ATrans;
  } = {};
  /**
   *  Transaction outside the current AppState's date window
   */
  outside_transactions: {
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
  categories: {
    [trans_id: number]: Category[];
  } = {};
  csvs_needing_mapping: CSVNeedsMapping[] = [];
  csvs_needing_account: CSVNeedsAccountAssigned[] = [];
  running_bank_macros = new Set<number>();
  account_balances: Balances = {};
  bucket_balances: Balances = {};

  // The amount in/out for each bucket for this month.
  bucket_flow: BucketFlowMap = {}
  getBucketFlow(bucket_id:number):BucketFlow {
    return this.bucket_flow[bucket_id] || Object.assign({}, emptyFlow);
  }

  // The amount of rain used in future months
  total_future_rain: number = 0;
  // The amount of THIS MONTH'S rain used in future months.
  rain_used_in_future: number = 0;
  month: number = localNow().month()+1;
  year: number = localNow().year();

  syncing: number = 0;

  // The computed rain for this month.
  rain: number = 0;
  bucket_total_balance: number = 0;
  open_accounts_balance: number = 0;
  all_accounts_assets: number = 0;
  all_accounts_debt: number = 0;
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
  offbudget_accounts: Account[] = [];

  can_sync = false;

  get defaultPostingDate():moment.Moment {
    let today = localNow();
    let d = this.viewDateRange.onOrAfter;
    if (d.month() == today.month() && d.year() == today.year()) {
      d = today;
    } else if (d.isBefore(today)) {
      d = d.endOf('month').startOf('day');
    } else {
      d = d.startOf('month').startOf('day');
    }
    return d.utc();
  }
  get viewDateRange():{onOrAfter:moment.Moment, before:moment.Moment} {
    let start = makeLocalDate(this.year, this.month-1, 1);
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
    if (appstate.accounts[trans.account_id].offbudget) {
      // Off-budget transaction
    } else {
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
    }
  })
  
  let gain = income + expenses;
  let num_unknowns = _.values(appstate.unknown_accounts).length;

  let kicked_buckets = [];
  let unkicked_buckets = [];
  Object.values<Bucket>(appstate.buckets).forEach(bucket => {
    if (bucket.kicked) {
      kicked_buckets.push(bucket);
    } else {
      unkicked_buckets.push(bucket);
    }
  })
  let unmatched_account_balances = 0;
  let open_accounts_balance = 0;
  let all_accounts_assets = 0;
  let all_accounts_debt = 0;
  let open_accounts = [];
  let closed_accounts = [];
  let offbudget_accounts = [];
  Object.values<Account>(appstate.accounts).forEach(account => {
    if (account.closed) {
      closed_accounts.push(account);
    } else {
      const bal = appstate.account_balances[account.id];
      if (bal > 0) {
        all_accounts_assets += bal;
      } else {
        all_accounts_debt += bal;
      }
      if (account.offbudget) {
        offbudget_accounts.push(account);
         
      } else {
        open_accounts.push(account);
        open_accounts_balance += bal;
      }
      if (expectedBalance(account) !== account.balance) {
        unmatched_account_balances += 1;
      }
    }
  })

  let rain = open_accounts_balance - bucket_total_balance;
  let rain_used_in_future = 0;

  if (rain > 0) {
    // Some of this rain might be used in future months
    if (appstate.total_future_rain > 0) {
      if (rain >= appstate.total_future_rain) {
        // future rain being used is less than the rain available this month.
        rain_used_in_future = appstate.total_future_rain;
      } else {
        // future rain being used exceeds rain available this month
        rain_used_in_future = rain;
      }
      rain -= rain_used_in_future;
    }
  }

  let can_sync = 
      !!Object.keys(appstate.sfinconnections).length
    ||!!Object.keys(appstate.bank_macros).length;
  return {
    bucket_total_balance,
    open_accounts_balance,
    all_accounts_assets,
    all_accounts_debt,
    rain,
    rain_used_in_future,
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
    offbudget_accounts,
    unmatched_account_balances,
    can_sync,
  };
}


class DelayingCounter<T> {
  readonly done = new EventSource<number>();
  private _count = new Set<T>();
  private _timer;
  constructor(private delay:number=200) {}
  add(val:T) {
    this._count.add(val);
    if (this._timer) {
      // restart the timer
      clearTimeout(this._timer);
    }
    this._timer = setTimeout(() => {
      let count = this._count.size;
      this.done.emit(count)
      this._count = new Set<T>();
    }, this.delay);
  }
}


export class StateManager {
  private store:IStore;

  public appstate:AppState;
  private queue: IObjectEvent[] = [];
  private posttick: Set<keyof StateManager> = new Set();

  private updated_trans_counter = new DelayingCounter();

  public events = {
    obj: new EventSource<IObjectEvent>(),
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
  checkpoint(label:string) {
    this.store.doAction(label, () => {});
    return this.store;
  }
  get nocheckpoint() {
    return this.store;
  }
  attach(store: IStore) {
    this.store = store;

    // Syncing events
    store.events.get('sync_started').on(message => {
      let onOrAfter = loadTS(message.onOrAfter);
      let before = loadTS(message.before);
      makeToast(sss('sync.toast.syncing', (start:moment.Moment, end:moment.Moment) => {
        return `Syncing transactions from ${start.format('ll')} to ${end.format('ll')}`;
      })(onOrAfter, before));
      this.appstate.syncing++;
      this.signalChange();
    })
    store.events.get('sync_done').on(message => {
      let { result } = message;
      let onOrAfter = loadTS(message.onOrAfter);
      let before = loadTS(message.before);
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
    store.events.get('macro_started').on(message => {
      this.appstate.running_bank_macros.add(message.id);
      this.signalChange();
    })
    store.events.get('macro_stopped').on(message => {
      this.appstate.running_bank_macros.delete(message.id);
      this.signalChange();
    })

    store.events.get('csv_needs_mapping').on(obj => {
      this.appstate.csvs_needing_mapping.push(obj);
      this.signalChange();
    });
    store.events.get('csv_mapping_response').on(obj => {
      this.appstate.csvs_needing_mapping = this.appstate.csvs_needing_mapping.filter(x => x.id !== obj.id);
      this.signalChange();
    })
    store.events.get('csv_needs_account_assigned').on(obj => {
      this.appstate.csvs_needing_account.push(obj);
      this.signalChange();
    })
    store.events.get('csv_account_response').on(obj => {
      this.appstate.csvs_needing_account = this.appstate.csvs_needing_account.filter(x => x.id !== obj.id);
      this.signalChange();
    })
  }
  async processEvent(ev:IObjectEvent):Promise<AppState> {
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
    if (isObj('account', obj)) {
      if (ev.event === 'update') {
        if (!this.appstate.accounts[obj.id]) {
          makeToast(sss('Account created: ') + obj.name);
        }
        this.appstate.accounts[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.accounts[obj.id];
      }
      this.posttick.add('fetchAccountBalances');
    } else if (isObj('bucket', obj)) {
      if (ev.event === 'update') {
        this.appstate.buckets[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.buckets[obj.id];
      }
      this.posttick.add('fetchBucketBalances');
      this.posttick.add('fetchBucketFlow');
      this.posttick.add('fetchFutureRainfall');
    } else if (isObj('bucket_group', obj)) {
      if (ev.event === 'update') {
        this.appstate.groups[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.groups[obj.id];
      }
    } else if (isObj('account_transaction', obj)) {
      if (ev.event === 'update') {
        this.updated_trans_counter.add(obj.id);
      }
      let dr = this.appstate.viewDateRange;
      let inrange = isBetween(parseLocalTime(obj.posted), dr.onOrAfter, dr.before)
      if (inrange) {
        // inside date range
        if (ev.event === 'update') {
          this.appstate.transactions[obj.id] = obj;
        } else {
          if (this.appstate.transactions[obj.id]) {
            delete this.appstate.transactions[obj.id];
          }
        }
      } else {
        // Outside date range
        if (ev.event === 'update') {
          this.appstate.outside_transactions[obj.id] = obj;
        } else {
          if (this.appstate.outside_transactions[obj.id]) {
            delete this.appstate.outside_transactions[obj.id];
          }
        }
      }
      this.store.sub.accounts.getCategories(obj.id)
      .then(cats => {
        this.appstate.categories[obj.id] = cats;
        this.signalChange();
      })
    } else if (isObj('bucket_transaction', obj)) {
      let dr = this.appstate.viewDateRange;
      let inrange = isBetween(parseLocalTime(obj.posted), dr.onOrAfter, dr.before)
      if (!inrange || ev.event === 'delete') {
        if (this.appstate.btransactions[obj.id]) {
          delete this.appstate.btransactions[obj.id];  
        }
      } else if (ev.event === 'update') {
        this.appstate.btransactions[obj.id] = obj;
      }
    } else if (isObj('simplefin_connection', obj)) {
      if (ev.event === 'update') {
        this.appstate.sfinconnections[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.sfinconnections[obj.id];
      }
    } else if (isObj('unknown_account', obj)) {
      if (ev.event === 'update') {
        if (!this.appstate.unknown_accounts[obj.id]) {
          makeToast(sss('Unknown account: ') + obj.description);
        }
        this.appstate.unknown_accounts[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.unknown_accounts[obj.id];
      }
    } else if (isObj('bank_macro', obj)) {
      if (ev.event === 'update') {
        this.appstate.bank_macros[obj.id] = obj;
      } else if (ev.event === 'delete') {
        delete this.appstate.bank_macros[obj.id];
      }
    } else if (isObj('settings', obj)) {
      this.appstate.settings[obj.key] = obj.value;
      if (obj.key === 'money_symbol') {
        setDefaultSymbol(obj.value);
      }
    }
    this.signalChange();
    return this.appstate;
  }
  
  signalChange = _.debounce(async () => {
    let posttick = Array.from(this.posttick.values());
    this.posttick.clear();
    await Promise.all(posttick.map(funcname => {
      return (this[funcname] as any)();
    }));
    this.recomputeTotals();
    this.events.change.emit(this.appstate);
  }, 50, {leading: true, trailing: true});

  /**
   *  @param year: Local year (as opposed to UTC year)
   *  @param month: Local month (as opposed to UTC month)
   */
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
      this.fetchSettings(),
      this.fetchAllAccounts(),
      this.fetchAllBuckets(),
      this.fetchAllGroups(),
      this.fetchAccountBalances(),
      this.fetchBucketBalances(),
      this.fetchBucketFlow(),
      this.fetchFutureRainfall(),
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
  async fetchSettings() {
    this.appstate.settings = await this.store.sub.settings.getSettings();
    setDefaultSymbol(this.appstate.settings.money_symbol);
  }
  fetchAllAccounts() {
    return this.store.sub.accounts.list()
      .then(accounts => {
        this.appstate.accounts = {};
        accounts.forEach(account => {
          this.appstate.accounts[account.id] = account;
        })
      })
  }
  fetchAccountBalances() {
    return this.store.sub.accounts.balances(this.appstate.viewDateRange.before)
      .then(balances => {
        this.appstate.account_balances = balances;
      })
  }
  fetchAllBuckets() {
    return this.store.sub.buckets.list()
      .then(buckets => {
        this.appstate.buckets = {};
        buckets.forEach(bucket => {
          this.appstate.buckets[bucket.id] = bucket;
        })
      })
  }
  fetchAllGroups() {
    return this.store.sub.buckets.listGroups()
      .then(groups => {
        this.appstate.groups = {}
        groups.forEach(group => {
          this.appstate.groups[group.id] = group;
        })
      })
  }
  fetchBucketBalances() {
    return this.store.sub.buckets.balances(this.appstate.viewDateRange.before)
      .then(balances => {
        this.appstate.bucket_balances = balances;
      })  
  }
  fetchBucketFlow() {
    return this.store.sub.buckets.getFlow(
      this.appstate.viewDateRange.onOrAfter,
      this.appstate.viewDateRange.before)
      .then(flow => {
        this.appstate.bucket_flow = flow;
      })
  }
  fetchFutureRainfall() {
    return this.store.sub.buckets.combinedRainfall({
      onOrAfter: this.appstate.viewDateRange.before,
    })
    .then(rainfall => {
      this.appstate.total_future_rain = rainfall;
    })
  }
  async fetchTransactions() {
    let range = this.appstate.viewDateRange;
    const transactions = await this.store.sub.accounts.listTransactions({
      posted: {
        onOrAfter: range.onOrAfter.subtract(4, 'days'),
        before: range.before.add(4, 'days'),
      }
    })
    this.appstate.transactions = {};
    this.appstate.outside_transactions = {};
    let trans_ids = [];
    const dr = this.appstate.viewDateRange;
    transactions.forEach(trans => {
      const inrange = isBetween(parseLocalTime(trans.posted), dr.onOrAfter, dr.before)
      if (inrange) {
        this.appstate.transactions[trans.id] = trans;  
      } else {
        this.appstate.outside_transactions[trans.id] = trans;
      }
      trans_ids.push(trans.id);
    })
    const categories = await this.store.sub.accounts.getManyCategories(trans_ids);
    this.appstate.categories = categories;
  }
  fetchBucketTransactions() {
    let range = this.appstate.viewDateRange;
    return this.store.sub.buckets.listTransactions({
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
    return this.store.sub.simplefin.listConnections()
    .then(connections => {
      this.appstate.sfinconnections = {};
      connections.forEach(obj => {
        this.appstate.sfinconnections[obj.id] = obj;
      })
    })
  }
  fetchUnknownAccounts() {
    return this.store.listObjects('unknown_account')
    .then(accounts => {
      this.appstate.unknown_accounts = {};
      accounts.forEach(obj => {
        this.appstate.unknown_accounts[obj.id] = obj;
      })
    })
  }
  fetchBankMacros() {
    return this.store.listObjects('bank_macro')
    .then(macros => {
      this.appstate.bank_macros = {};
      macros.forEach(obj => {
        this.appstate.bank_macros[obj.id] = obj;
      })
    })
  }
}

export const manager = new StateManager();
