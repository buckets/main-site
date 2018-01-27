import * as req from 'request-promise'
import * as moment from 'moment'

import { IObject, IStore, registerClass } from '../store'
import { ts2db, localNow, Timestamp, ensureUTCMoment } from '../time'
import { decimal2cents } from '../money'
import { Transaction } from './account'
import { sss } from '../i18n'
import { hashStrings } from '../util'
import { UnknownAccount } from './account'
import { PrefixLogger } from '../logging'

const log = new PrefixLogger('(simplefin)')

import { ISyncChannel, ASyncening, SyncResult } from '../sync'

export class Connection implements IObject {
  static type: string = 'simplefin_connection'
  id: number;
  created: string;
  readonly _type: string = Connection.type;
  
  access_token: string;
  last_used: string;
}
registerClass(Connection);

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

class SimpleFINSync implements ASyncening {
  public result:SyncResult;

  private time_range:number = 7;
  private time_unit:string = 'day';
  private delay = 100;
  private please_stop:boolean = false;

  constructor(private store:IStore, readonly onOrAfter:moment.Moment, readonly before:moment.Moment) {

  }
  async start() {
    let { onOrAfter, before } = this;
    log.info(`Sync started from ${onOrAfter.format('l')} to ${before.format('l')}`)
    this.please_stop = false;

    let imported_count = 0;
    let errors = new Set();
    try {
      let window_start = onOrAfter.clone();
      let window_end = window_start.clone().add(this.time_range as any, this.time_unit);

      while (!this.please_stop && window_start.isSameOrBefore(before)) {
        if (window_end.isAfter(before)) {
          window_end = before.clone();
        }

        try {
          let result = await this.store.simplefin.sync(window_start, window_end)  
          imported_count += result.transactions.length;
          result.errors.forEach(err => {
            log.info(`SimpleFin error: ${err}`);
            errors.add(err);
          })
        } catch(err) {
          log.info(`Server error while syncing.  Aborting: ${err}`)
          errors.add(sss('Sync failed'));
          break;
        }
        await sleep(this.delay);
        window_start.add(this.time_range as any, this.time_unit);
        window_end.add(this.time_range as any, this.time_unit);
      }
    } catch(err) {
      log.error("Unexpected sync error:", err.toString(), err.stack)
      errors.add(sss('Unexpected sync error'))
    } finally {
      this.please_stop = false;
      this.result = {
        errors: Array.from(errors),
        imported_count,
      }
    }
    return this.result;
  }
  cancel() {
    this.please_stop = true;
  }
}

export class SimpleFINSyncer implements ISyncChannel {
  constructor(private store:IStore) {

  }
  syncTransactions(onOrAfter:moment.Moment, before:moment.Moment):SimpleFINSync {
    return new SimpleFINSync(this.store, onOrAfter, before);
  }
}

export class SimpleFINStore {
  private client:SimpleFINClient;
  
  constructor(private store:IStore) {
    this.client = new SimpleFINClient();
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
  async sync(since:moment.Moment, enddate:moment.Moment):Promise<{
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
      errors = errors.concat(accountset.errors);
      await Promise.all(accountset.accounts.map(async account => {
        // find the matching account_id
        let hash = this.computeHash(account.org, account.id);
        let account_id = await this.store.accounts.hashToAccountId(hash)
        if (account_id) {
          let has_transactions = await this.store.accounts.hasTransactions(account_id);
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
          let balance_update_data:any = {
            import_balance: parseStringAmount(account.balance),
          }
          if (!has_transactions) {
            balance_update_data.balance = balance_update_data.import_balance;
          }
          this.store.accounts.update(account_id, {
            import_balance: parseStringAmount(account.balance),
          })
        } else {
          // no matching account
          let unknown = await this.store.accounts.getOrCreateUnknownAccount({
            description: `${account.org.name || account.org.domain} ${account.name} (${account.id}) ${account.balance}`,
            account_hash: hash,
          })
          unknowns.push(unknown);
        }
      }))
      if (got_data) {
        return this.store.updateObject(Connection, conn.id, {
          last_used: ts2db(localNow())
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
      throw new SimpleFinError(sss('Invalid SimpleFIN Token'));
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
      throw new SimpleFinError(sss('Unable to claim access token'));
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
      throw new SimpleFinError(sss('Error fetching data'));
    }

    try {
      return JSON.parse(result);
    } catch(err) {
      log.error(err);
      throw new SimpleFinError(sss('Error parsing response'));
    }
  }
}
