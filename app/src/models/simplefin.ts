import * as req from 'request-promise'
import * as log from 'electron-log';
import { IObject, IStore } from '../store'
import * as crypto from 'crypto'

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
    "balance-date": string;
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
    posted: string;
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
  async useTokens():Promise<any> {
    let connections = await this.listConnections();
    let promises = connections.map(async conn => {
      let accountset = await this.client.fetchAccounts(conn.access_token);
      accountset.accounts.forEach(account => {
        // find the matching account_id
        let hash = this.computeHash(account.org, account.id);
        This is where you are, matt
      })
    })
  }
  computeHash(org:SFIN.Organization, account_id:string):string {
    return hashStrings([org.name || org.domain, account_id]);
  }
  async findMatchingAccount()
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
  async fetchAccounts(access_url:string):Promise<SFIN.AccountSet> {
    let result;
    let uri = `${access_url}/accounts`;
    try {
      result = await req({
        uri: uri,
      })
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