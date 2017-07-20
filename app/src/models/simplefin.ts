import * as req from 'request-promise'
import * as log from 'electron-log';
import * as moment from 'moment'
import { IObject, IStore } from '../store'
import * as crypto from 'crypto'
import { ts2db, Timestamp, ensureUTCMoment } from '../time'
import { decimal2cents } from '../money'
import { Transaction } from './account'
import { EventEmitter } from 'events'

export class Connection implements IObject {
  static table_name: string = 'simplefin_connection'
  id: number;
  created: string;
  readonly _type: string = Connection.table_name;
  
  access_token: string;
  last_used: string;
}
export class UnknownAccount implements IObject {
  static table_name: string = 'unknown_account'
  id: number;
  created: string;
  readonly _type: string = UnknownAccount.table_name;

  description: string;
  account_hash: string;
}
export class AccountMapping implements IObject {
  static table_name: string = 'account_mapping'
  id: number;
  created: string;
  readonly _type: string = AccountMapping.table_name;

  account_id: number;
  account_hash: string;
}

export declare namespace SFIN {
  export interface AccountSet {
    errors: string[];
    accounts: Account[];
  }
  export interface Account {
    org: Organization;
    id: string;
    name: string;
    currency: string | {name:string, abbr:string};
    balance: string;
    "available-balance": string;
    "balance-date": number;
    transactions: Transaction[];
    extra: object;
  }
  export interface Organization {
    domain?: string;
    "sfin-url": string;
    name?: string;
  }
  export interface Transaction {
    id: string;
    posted: number;
    amount: string;
    description: string;
    extra: object;
  }
}

function hashStrings(strings:string[]):string {
  let ret = crypto.createHash('sha256');
  strings.forEach(s => {
    let hash = crypto.createHash('sha256');
    hash.update(s)
    ret.update(hash.digest('hex'))
  });
  return ret.digest('hex');
}

export function parseStringAmount(x:string):number {
  return decimal2cents(x)
}
export function parseTimestamp(x:number):moment.Moment {
  return moment.unix(x);
}

export function sleep(milliseconds:number):Promise<any> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, milliseconds);
  })
}


export class Syncer extends EventEmitter {
  private time_range:number = 1;
  private time_unit:string = 'day';
  private delay = 1000;
  private max_delay = 60 * 1000;
  private running:boolean = false;
  private please_stop:boolean = false;
  constructor(private store:SimpleFINStore) {
    super();
  }
  incDelay() {
    this.delay *= 1.5;
    if (this.delay > this.max_delay) {
      this.delay = this.max_delay;
    }
  }
  stop() {
    if (this.running) {
      this.please_stop = true;
    }
  }
  isRunning() {
    return this.running;
  }
  stopRequested() {
    return this.please_stop;
  }
  async start(sync_start:moment.Moment, sync_end:moment.Moment) {
    if (this.running) {
      return;
    }
    this.please_stop = false;
    this.running = true;
    this.emit('start', {
      sync_start: sync_start.clone(),
      sync_end: sync_end.clone(),
    });

    let window_start = sync_start.clone();
    let window_end = window_start.clone().add(this.time_range as any, this.time_unit);

    let trans_count = 0;
    let errors = new Set();
    while (!this.please_stop && window_start.isSameOrBefore(sync_end)) {
      if (window_end.isAfter(sync_end)) {
        window_end = sync_end.clone();
      }
      this.emit('fetching-range', {start:window_start, end:window_end});

      try {
        let result = await this.store._sync(window_start, window_end)  
        trans_count += result.transactions.length;
        result.errors.forEach(err => {
          log.info(`SimpleFin error: ${err}`);
          errors.add(err);
        })
        if (result.errors.length) {
          this.incDelay();
          await sleep(this.delay);
          continue;
        }
      } catch(err) {
        log.info(`Server error while syncing; sleeping for ${this.delay}: ${err}`)
        this.incDelay();
        await sleep(this.delay);
        continue;
      }
      await sleep(this.delay);
      window_start.add(this.time_range as any, this.time_unit);
      window_end.add(this.time_range as any, this.time_unit);
    }
    this.running = false;
    this.emit('done', {
      trans_count,
      errors,
      sync_start,
      sync_end,
      cancelled: this.please_stop,
    })
  }
}


export class SimpleFINStore {
  private client:SimpleFINClient;
  syncer:Syncer;
  constructor(private store:IStore) {
    this.client = new SimpleFINClient();
    this.syncer = new Syncer(this);
  }
  async consumeToken(token:string):Promise<Connection> {
    let access_url = await this.client.consumeToken(token);
    return this.store.createObject(Connection, {
      access_token: access_url,
    })
  }
  async listConnections():Promise<Connection[]> {
    return this.store.listObjects(Connection);
  }
  // async marchingSync(since:moment.Moment, enddate:moment.Moment):Promise<{
  //   transactions: Transaction[],
  //   unknowns: UnknownAccount[],
  //   errors: string[],
  // }> {
  //   let transactions:Transaction[] = [];
  //   let unknowns:UnknownAccount[] = [];
  //   let errors:string[] = [];
  //   let delay = 3000;
  //   let err_delay = 30 * 1000;
  //   since = ensureUTCMoment(since);
  //   enddate = ensureUTCMoment(enddate);
  //   let window_start = since.clone();
  //   let window_end = since.clone().add(1, 'day');
  //   if (window_end.isAfter(enddate)) {
  //     window_end = enddate;
  //   }
  //   while (window_end.isSameOrBefore(enddate)) {
  //     log.info(`fetching ${window_start.format()} to ${window_end.format()}`);
  //     try {
  //       let result = await this.sync(window_start, window_end)  
  //       transactions = transactions.concat(result.transactions)
  //       unknowns = unknowns.concat(result.unknowns);
  //       errors = errors.concat(result.errors);
  //     } catch(err) {
  //       log.info(`Error while syncing; sleeping for ${err_delay}: ${err}`)
  //       await sleep(err_delay);
  //       continue;
  //     }
  //     await sleep(delay);
  //     window_start.add(1, 'day');
  //     window_end.add(1, 'day');
  //   }
  //   return {
  //     transactions,
  //     unknowns,
  //     errors,
  //   }
  // }
  async _sync(since:moment.Moment, enddate:moment.Moment):Promise<{
    transactions: Transaction[],
    unknowns: UnknownAccount[],
    errors: string[],
  }> {
    let connections = await this.listConnections();
    let transaction_promises = [];
    let unknowns = [];
    let errors = [];
    let promises = connections.map(async conn => {
      let got_data = false;
      let accountset = await this.client.fetchAccounts(conn.access_token, since, enddate);
      log.info('accountset', accountset);
      errors = errors.concat(accountset.errors);
      await Promise.all(accountset.accounts.map(async account => {
        // find the matching account_id
        let hash = this.computeHash(account.org, account.id);
        let rows = await this.store.query(`SELECT account_id FROM account_mapping
          WHERE account_hash=$hash`, {$hash: hash})
        if (rows.length) {
          let account_id = rows[0].account_id;
          account.transactions
          .map(trans => {
              got_data = true;
              return this.store.accounts.importTransaction({
                account_id,
                amount: parseStringAmount(trans.amount),
                memo: trans.description,
                posted: parseTimestamp(trans.posted),
                fi_id: trans.id,
              })
            })
          .forEach(p => { transaction_promises.push(p) });
        } else {
          // no matching account
          try {
            let unknown = await this.store.createObject(UnknownAccount, {
              description: `${account.org.name || account.org.domain} ${account.name}`,
              account_hash: hash,
            })
            unknowns.push(unknown);
          } catch(err) {
            log.warn(err);
          }
        }
      }))
      if (got_data) {
        return this.store.updateObject(Connection, conn.id, {
          last_used: ts2db(moment())
        })
      }
    })
    await Promise.all(promises);
    let transactions = await Promise.all(transaction_promises);
    return {
      transactions,
      unknowns,
      errors,
    }
  }
  computeHash(org:SFIN.Organization, account_id:string):string {
    return hashStrings([org.name || org.domain, account_id]);
  }
  async linkAccountToHash(hash:string, account_id:number) {
    await this.store.createObject(AccountMapping, {
      account_id: account_id,
      account_hash: hash,
    })
    let unknowns = await this.store.listObjects(UnknownAccount, {
      where: 'account_hash = $account_hash',
      params: { $account_hash: hash },
    })
    let promises = unknowns.map(unknown => {
      return this.store.deleteObject(UnknownAccount, unknown.id)
    })
    await Promise.all(promises);
  }
}

class SimpleFinError extends Error {
}

// https://www.simplefin.org/protocol.html
class SimpleFINClient {
  async consumeToken(token:string) {
    // base64 decode
    let claim_url;
    try {
      claim_url = Buffer.from(token, 'base64').toString();
    } catch(err) {
      log.error(err);
      throw new SimpleFinError('Invalid SimpleFIN Token');
    }

    // claim it
    let access_url;
    try {
      access_url = await req({
        uri: claim_url,
        method: 'POST',
      })
    } catch(err) {
      log.error(err);
      throw new SimpleFinError('Unable to claim access token');
    }
    return access_url;
  }
  async fetchAccounts(access_url:string, since:Timestamp, enddate:Timestamp):Promise<SFIN.AccountSet> {
    let result;
    let uri = `${access_url}/accounts`;
    try {
      let options:req.Options = {uri, qs: {}};
      since = ensureUTCMoment(since);
      enddate = ensureUTCMoment(enddate);
      options.qs['start-date'] = since.unix();
      options.qs['end-date'] = enddate.unix();
      result = await req(options);
    } catch(err) {
      log.error(err);
      throw new SimpleFinError('Error fetching data');
    }

    try {
      return JSON.parse(result);
    } catch(err) {
      log.error(err);
      throw new SimpleFinError('Error parsing response');
    }
  }
}

if (require.main === module) {
  async function test() {
    let client = new SimpleFINClient();
    let token = await client.consumeToken('aHR0cHM6Ly9icmlkZ2Uuc2ltcGxlZmluLm9yZy9zaW1wbGVmaW4vY2xhaW0vZGVtbw==')
    console.log('token', token);
    let data = await client.fetchAccounts(token, moment().subtract(30, 'days'), moment().add(1, 'day'));
    console.log('data', data);
  }
  test()
}