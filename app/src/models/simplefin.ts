import * as req from 'request-promise'
import * as log from 'electron-log';
import * as moment from 'moment'
import { IObject, IStore } from '../store'
import * as crypto from 'crypto'
import { ts2db, Timestamp, ensureUTCMoment } from '../time'
import { decimal2cents } from '../money'
import { Transaction } from './account'

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
  async sync(since?:moment.Moment, enddate?:moment.Moment):Promise<{
    transactions: Transaction[],
    unknowns: UnknownAccount[],
  }> {
    let connections = await this.listConnections();
    let transaction_promises = [];
    let unknowns = [];
    let promises = connections.map(async conn => {
      let got_data = false;
      let accountset = await this.client.fetchAccounts(conn.access_token, since, enddate);

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
  async fetchAccounts(access_url:string, since?:Timestamp, enddate?:Timestamp):Promise<SFIN.AccountSet> {
    let result;
    let uri = `${access_url}/accounts`;
    try {
      let options:req.Options = {uri};
      if (since) {
        since = ensureUTCMoment(since);
        options.qs = {
          'start-date': since.unix(),
        }
      }
      if (enddate) {
        enddate = ensureUTCMoment(enddate);
        options.qs = {
          'end-date': enddate.unix(),
        }
      }
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
    let data = await client.fetchAccounts(token);
    console.log('data', data);
  }
  test()
}