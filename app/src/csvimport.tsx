import * as React from 'react'
import * as csv from 'csv'
import * as moment from 'moment'
import {v4 as uuid} from 'uuid'

import { manager } from './budget/appstate'
import { sss } from './i18n'
import { Money, decimal2cents } from './money'
import { Date, serializeTimestamp } from './time'
import { ImportableAccountSet, ImportableTrans } from './importing'
import { Account, CSVImportMapping } from './models/account'
import { IStore } from './store'
import { IBudgetFile, current_file } from './mainprocess/files'
import { hashStrings, isNil } from './util'
import { PrefixLogger } from './logging'
import { makeToast } from './budget/toast'

const log = new PrefixLogger('(csv)')


interface ParsedCSV<T> {
  headers: string[];
  rows: T[];
}
export async function parseCSVStringWithHeader<T>(guts:string):Promise<ParsedCSV<T>> {
  return new Promise<ParsedCSV<T>>((resolve, reject) => {
    let headers:string[] = [];
    csv.parse(guts, {columns: (header_row:string[]) => {
      headers = header_row
      return header_row;
    }}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          headers,
          rows: data as T[],
        })
      }
    })
  })
}

export function csvFieldToCents(x:string) {
  let result = decimal2cents(x.replace(/[^-0-9\.,]/g, ''));
  return result;
}

export interface CSVMapping {
  amount: string;
  memo: string;
  posted: string;
  posted_format?: string;
  fi_id?: string;
}
export interface CSVNeedsMapping {
  id: string;
  parsed_data: ParsedCSV<any>;
}
export interface CSVHasMapping {
  id: string;
  mapping: CSVMapping;
}
export interface CSVNeedsAccountAssigned {
  id: string;
  transactions: ImportableTrans[];
}
export interface CSVHasAccountAssigned {
  id: string;
  account_id: number;
}

export async function csv2importable(store:IStore, bf:IBudgetFile, guts:string):Promise<ImportableAccountSet> {
  log.silly('csv2importable', guts.length);
  const parsed = await parseCSVStringWithHeader(guts);
  const fingerprint = hashStrings(parsed.headers);
  log.silly('fingerprint', fingerprint);
  let csv_mapping = await store.accounts.getCSVMapping(fingerprint);
  if (csv_mapping === null) {
    // no current mapping
    log.debug('no current mapping')
    let need:CSVNeedsMapping = {
      id: uuid(),
      parsed_data: parsed,
    };
    bf.room.broadcast('csv_needs_mapping', need);
    csv_mapping = await new Promise<CSVImportMapping>((resolve, reject) => {
      bf.room.events('csv_has_mapping').onceSuccessfully(async message => {
        if (message.id === need.id) {
          // now there's a mapping
          let new_mapping = await store.accounts.setCSVMapping(fingerprint, message.mapping);
          resolve(new_mapping);
          return true;
        }
        // wrong object
        return false;
      })
    });
  }

  // Use the mapping
  log.silly('there is a mapping');
  const mapping = JSON.parse(csv_mapping.mapping_json) as CSVMapping;
  log.silly(mapping);
  let hashcount = {};
  const transactions = parsed.rows.map((row):ImportableTrans => {
    const amount = csvFieldToCents(row[mapping.amount]);
    const memo = row[mapping.memo];
    const posted = serializeTimestamp(moment(row[mapping.posted], mapping.posted_format));
    let fi_id;
    if (mapping.fi_id) {
      fi_id = row[mapping.fi_id];
    } else {
      // Generate an id based on transaction details
      let rowhash = hashStrings([amount.toString(), memo, posted])
      
      // If there are dupes within a CSV, they should have different fi_ids
      if (!hashcount[rowhash]) {
        hashcount[rowhash] = 0;
      }
      hashcount[rowhash] += 1;
      let full_row_hash = hashStrings([rowhash, hashcount[rowhash].toString()])
      fi_id = `buckets-${full_row_hash}`;
    }
    return {
      amount,
      memo,
      posted,
      fi_id,
    }
  })
  log.silly('transactions', transactions.length);

  // Get an account id
  const need:CSVNeedsAccountAssigned = {
    id: uuid(),
    transactions,
  }
  bf.room.broadcast('csv_needs_account_assigned', need);
  log.debug('csv_needs_account_assigned', need.id);
  const account_id = await new Promise<number>((resolve, reject) => {
    bf.room.events('csv_has_account_assigned').onceSuccessfully(msg => {
      if (msg.id === need.id) {
        resolve(msg.account_id);
        return true;
      }
      return false;
    })
  });

  return {
    accounts: [{
      transactions,
      account_id,
    }],
  }
}


interface CSVMapperProps {
  obj: CSVNeedsMapping;
}
interface CSVMapperState {
  mapping: CSVMapping;
}
export class CSVMapper extends React.Component<CSVMapperProps, CSVMapperState> {
  constructor(props) {
    super(props);
    this.state = {
      mapping: {
        amount: null,
        memo: null,
        posted: null,
        posted_format: null,
        fi_id: null,
      }
    }
  }
  render() {
    let { obj } = this.props;
    let inverse_mapping = {};
    let { mapping } = this.state;
    Object.keys(mapping).forEach(key => {
      let val = mapping[key];
      if (!isNil(val)) {
        inverse_mapping[val] = key;
      }
    })
    return <div>
      <button onClick={() => {
        current_file.room.broadcast('csv_has_mapping', {
          id: obj.id,
          mapping: this.state.mapping,
        })
      }}>
        {sss('Set mapping')}
      </button>
      <table className="ledger">
        <thead>
          <tr>
            {obj.parsed_data.headers.map(header => {
              let value = inverse_mapping[header] || '' 
              return <th key={header}>
                <div>
                  <select
                    value={value}
                    onChange={ev => {
                      this.setState({mapping: Object.assign(mapping, {
                        [ev.target.value]: header,
                      })})
                    }}
                  >
                    <option value=""></option>
                    <option value="amount">{sss('Amount')}</option>
                    <option value="memo">{sss('Memo')}</option>
                    <option value="posted">{sss('Date')}</option>
                    <option value="fi_id">{sss('ID')}</option>
                  </select>
                </div>
                {value === 'posted' ? <div>
                  <select
                      value={mapping.posted_format}
                      onChange={ev => {
                        this.setState({mapping: Object.assign(mapping, {
                          posted_format: ev.target.value,
                        })})
                      }}>
                    <option value="">---</option>
                    <option>YYYY-MM-DD</option>
                    <option>YYYY-DD-MM</option>
                    
                    <option>M/D/YYYY</option>
                    <option>M/D/YY</option>
                    <option>MM/DD/YYYY</option>
                    <option>MM/DD/YY</option>

                    <option>D/M/YYYY</option>
                    <option>D/M/YY</option>
                    <option>DD/MM/YYYY</option>
                    <option>DD/MM/YY</option>
                    
                    <option>MMM DD, YYYY</option>
                  </select>
                </div> : null}
              </th>
            })}
          </tr>
          <tr>
            {obj.parsed_data.headers.map(header => {
              return <th key={header}>{header}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {obj.parsed_data.rows.map((row, idx) => {
            return <tr key={idx}>
              {obj.parsed_data.headers.map(header => {
                return <td key={header}>{row[header]}</td>
              })}
            </tr>
          })}
        </tbody>
      </table>
    </div>
  }
}


interface CSVAssignerProps {
  accounts: Account[];
  obj: CSVNeedsAccountAssigned;
}
interface CSVAssignerState {
  account_id: number | 'NEW';
  new_name: string;
}
export class CSVAssigner extends React.Component<CSVAssignerProps, CSVAssignerState> {
  constructor(props) {
    super(props);
    this.state = {
      account_id: null,
      new_name: '',
    }
  }
  render() {
    let { obj, accounts } = this.props;
    let { account_id, new_name } = this.state;
    return <table className="ledger">
      <thead>
        <tr>
          <th>{sss('Posted')}</th>
          <th>{sss('Memo')}</th>
          <th>{sss('Amount')}</th>
          <th>
            <select value={account_id || ''}
              onChange={ev => {
                let val = ev.target.value;
                if (val === 'NEW') {
                  this.setState({account_id: 'NEW'})
                } else {
                  this.setState({account_id: Number(ev.target.value)})
                }
              }}>
              <option value="NEW">{sss('Create new account')}</option>
              <option value=""></option>
              {accounts.map(account => {
                return <option value={account.id} key={account.id}>{account.name}</option>
              })}
            </select>
          </th>
          <th>
            <button onClick={async () => {
              if (account_id === 'NEW') {
                if (!new_name) {
                  makeToast(sss('Provide a name for the new account.'), {className:'error'})
                  return;
                }
                let new_account = await manager.store.accounts.add(new_name);
                account_id = new_account.id;
              }
              current_file.room.broadcast('csv_has_account_assigned', {
                id: obj.id,
                account_id,
              })
            }}>
              {sss('Finish import')}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {obj.transactions.map((trans, idx) => {
          return <tr key={idx}>
            <td><Date value={trans.posted} /></td>
            <td>{trans.memo}</td>
            <td><Money value={trans.amount} /></td>
          </tr>
        })}
      </tbody>
    </table>
  }
}
