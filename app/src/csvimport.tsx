import * as React from 'react'
import * as csv from 'csv'
import * as moment from 'moment-timezone'
import {v4 as uuid} from 'uuid'

import { manager } from './budget/appstate'
import { sss } from './i18n'
import { Money, decimal2cents } from './money'
import { DateDisplay, parseLocalTime, dumpTS, loadTS } from './time'
import { ImportableAccountSet, ImportableTrans } from './importing'
import { Account, CSVImportMapping } from './core/models/account'
import { IStore } from './store'
import { IBudgetFile, current_file } from './mainprocess/files'
import { hashStrings } from './util'
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
    csv.parse(guts, {
      relax_column_count: true,
      columns(header_row:string[]) {
        headers = header_row
        return header_row;
      }
    }, (err, data) => {
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
  x = x.replace(/[^-\(\)0-9\.,]/g, '')
  if (x.startsWith('(') && x.endsWith(')')) {
    x = `-${x.substr(1, x.length-1)}`;
  }
  return decimal2cents(x);
}

function guessDateFormat(formats:string[], dates:string[]):string[] {
  let ret = new Set<string>(formats);
  let results:{
    [format:string]: number[],
  } = {};
  formats.forEach(format => {
    results[format] = [];
  })
  for (let date of dates) {
    ret.forEach(format => {
      let dt = moment(date, format);
      if (!dt.isValid()) {
        ret.delete(format);
      } else {
        results[format].push(dt.unix());
      }
    })
  }
  let ranges:{
    [format:string]: number,
  } = {};
  ret.forEach(format => {
    let numbers = results[format]
    ranges[format] = Math.max(...numbers) - Math.min(...numbers);
  })
  return Array.from(ret).sort((a,b) => {
    return ranges[a] - ranges[b]
  });
}

function invertMapping(mapping:CSVMapping):{
  amount?: string[],
  memo?: string[],
  posted?: string[],
  fi_id?: string[],
} {
  let inverted_mapping = {
    amount: [],
    memo: [],
    posted: [],
    fi_id: [],
  };
  Object.keys(mapping.fields).sort().forEach(header => {
    const val = mapping.fields[header];
    inverted_mapping[val].push(header);
  })
  return inverted_mapping;
}

export interface CSVMapping {
  fields: {
    [field:string]: 'amount'|'memo'|'posted'|'fi_id';
  }
  posted_format?: string;
}
export interface CSVNeedsMapping {
  id: string;
  parsed_data: ParsedCSV<any>;
  current_mapping?: CSVMapping;
}
export interface CSVMappingResponse {
  id: string;
  mapping: CSVMapping;
}
export interface CSVNeedsAccountAssigned {
  id: string;
  transactions: ImportableTrans[];
}
export interface CSVAssignAccountResponse {
  id: string;
  account_id: number;
  redo_mapping?: boolean;
}

export async function csv2importable(store:IStore, bf:IBudgetFile, guts:string, args:{
  force_mapping?:boolean,
} = {}):Promise<ImportableAccountSet> {
  log.info('csv2importable', guts.length);
  const parsed = await parseCSVStringWithHeader(guts);
  const fingerprint = hashStrings(parsed.headers);
  log.info('fingerprint', fingerprint);
  let csv_mapping = await store.accounts.getCSVMapping(fingerprint);
  if (csv_mapping === null || args.force_mapping) {
    // no current mapping
    let need:CSVNeedsMapping = {
      id: uuid(),
      parsed_data: parsed,
      current_mapping: csv_mapping ? JSON.parse(csv_mapping.mapping_json) : undefined,
    };
    bf.room.broadcast('csv_needs_mapping', need);
    csv_mapping = await new Promise<CSVImportMapping>((resolve, reject) => {
      bf.room.events('csv_mapping_response').onceSuccessfully(async message => {
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
  const mapping = JSON.parse(csv_mapping.mapping_json) as CSVMapping;
  log.info('mapping', mapping);
  let hashcount = {};
  let inverted_mapping = invertMapping(mapping);
  const transactions = parsed.rows.map((row):ImportableTrans => {
    const amount = csvFieldToCents(inverted_mapping.amount.map(key => row[key]).filter(x=>x)[0]);
    const memo = inverted_mapping.memo.map(key=>row[key]).join(' ');
    const posted = parseLocalTime(row[inverted_mapping.posted[0]], mapping.posted_format);
    let fi_id:string;
    if (inverted_mapping.fi_id.length) {
      fi_id = inverted_mapping.fi_id.map(key=>row[key]).join(' ')
    } else {
      // Generate an id based on transaction details
      let rowhash = hashStrings([amount.toString(), memo, posted.toISOString()])
      
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
      posted: dumpTS(posted),
      fi_id,
    }
  })
  log.info('transactions', transactions.length);

  // Get an account id
  const need:CSVNeedsAccountAssigned = {
    id: uuid(),
    transactions,
  }
  bf.room.broadcast('csv_needs_account_assigned', need);
  log.info('csv_needs_account_assigned', need.id);
  const {account_id, redo_mapping} = await new Promise<CSVAssignAccountResponse>((resolve, reject) => {
    bf.room.events('csv_account_response').onceSuccessfully(msg => {
      if (msg.id === need.id) {
        resolve(msg);
        return true;
      }
      return false;
    })
  });
  log.info('csv_account_response', account_id, redo_mapping);

  if (redo_mapping) {
    // It's probably better to not do this recursively, but how many
    // times are people going to recurse?  Famous last words? :)
    log.info('redoing mapping');
    return await csv2importable(store, bf, guts, {force_mapping: true});
  }

  if (account_id === null) {
    return null;
  }

  return {
    accounts: [{
      transactions,
      account_id,
    }],
  }
}

const DATE_FORMATS = [
  "YYYY-MM-DD",
  "YYYY-DD-MM",
  "MM/DD/YYYY",
  "MM/DD/YY",
  "DD/MM/YYYY",
  "DD/MM/YY",
  "MMM DD, YYYY",
]


interface CSVMapperProps {
  obj: CSVNeedsMapping;
}
interface CSVMapperState {
  mapping: CSVMapping;
  format_options: string[];
}
export class CSVMapper extends React.Component<CSVMapperProps, CSVMapperState> {
  constructor(props:CSVMapperProps) {
    super(props);
    let mapping = props.obj.current_mapping || {
      fields: {},
      posted_format: null,
    }
    let guess = this.computeFormatOptionsAndBestGuess(mapping, props.obj);
    if (guess.posted_format !== undefined) {
      mapping.posted_format = guess.posted_format;
    }
    this.state = {
      mapping: mapping,
      format_options: guess.format_options,
    }
  }
  computeFormatOptionsAndBestGuess(mapping:CSVMapping, obj:CSVNeedsMapping) {
    let ret:{
      posted_format?: string,
      format_options?: string[],
    } = {};
    let format_options = DATE_FORMATS;
    let inverted_mapping = invertMapping(mapping);
    if (inverted_mapping.posted.length) {
      let date_strings = obj.parsed_data.rows.map(row => {
        return row[inverted_mapping.posted[0]]
      })
      format_options = guessDateFormat(DATE_FORMATS, date_strings);
      if (format_options.length) {
        if (!mapping.posted_format) {
          // XXX you really shouldn't be setting state in here
          ret.posted_format = format_options[0]
        }
        ret.format_options = format_options;
      }
    }
    return ret;
  }
  render() {
    let { obj } = this.props;
    let { mapping, format_options } = this.state;

    let mapped_fields = Object.values(mapping.fields);
    const mapping_acceptable = (
      mapped_fields.indexOf('amount') !== -1
      && mapped_fields.indexOf('memo') !== -1
      && mapped_fields.filter(x=>x==='posted').length === 1
      && mapping.posted_format
    );

    return <div>
      <ol className="instructions">
        <li>{sss('Identify the data each column contains using the drop downs below.')}</li>
        <li>{sss('You must have at least one column each set to Amount, Memo and Date Posted.')}</li>
        <li>{sss('For Date Posted, you must also choose the date format.')}</li>
        <li>{sss('If multiple columns are selected for Amount, the first non-zero value will be used.  This is helpful if the CSV contains separate Credit and Debit columns.')}</li>
        <li>{sss('Only select a column for Unique ID if you are sure it contains bank-assigned, unique transaction IDs.  Most CSVs will not have this field.')}</li>
        <li>{sss('Click the "Set mapping" to continue.')}</li>
      </ol>
      <table className="ledger">
        <thead>
          <tr>
            {obj.parsed_data.headers.map(header => {
              let value = mapping.fields[header] || '';
              return <th
                  key={header}
                  colSpan={value==='posted'||value==='amount' ? 2 : 1 }>
                <div>
                  <select
                    value={value}
                    onChange={ev => {
                      let new_fields = Object.assign(mapping.fields, {
                        [header]: ev.target.value,
                      })
                      let new_mapping = Object.assign(mapping, {
                        fields: new_fields,
                      })

                      let newstate:any = {mapping: new_mapping}

                      if (ev.target.value === 'posted') {
                        let guess = this.computeFormatOptionsAndBestGuess(new_mapping, obj)
                        if (!new_mapping.posted_format && guess.posted_format) {
                          new_mapping.posted_format = guess.posted_format
                        }
                        newstate.format_options = guess.format_options;
                      }
                      this.setState(newstate);
                    }}
                  >
                    <option value=""></option>
                    <option value="amount">{sss('Amount')}</option>
                    <option value="memo">{sss('Memo')}</option>
                    <option value="posted">{sss('Date Posted')}</option>
                    <option value="fi_id">{sss('Unique ID')} {sss('(optional)')}</option>
                  </select>
                </div>
                {value === 'posted' ? <div>
                  <select
                      value={mapping.posted_format || ''}
                      onChange={ev => {
                        this.setState({mapping: Object.assign(mapping, {
                          posted_format: ev.target.value,
                        })})
                      }}>
                    {format_options.map(option => {
                      return <option key={option}>{option}</option>
                    })}
                  </select>
                </div> : null}
              </th>
            })}
            <th>
              <button
                className="primary"
                disabled={!mapping_acceptable}
                onClick={() => {
                  current_file.room.broadcast('csv_mapping_response', {
                    id: obj.id,
                    mapping: this.state.mapping,
                  })
                }}>
                {sss('Set mapping')}
              </button>
            </th>
          </tr>
          <tr>
            {obj.parsed_data.headers.map(header => {
              let value = mapping.fields[header] || '' 
              return <th
                key={header}
                colSpan={value === 'posted'|| value === 'amount' ? 2 : 1}
              >{header}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {obj.parsed_data.rows.map((row, idx) => {
            return <tr key={idx}>
              {obj.parsed_data.headers.map(header => {
                let value = mapping.fields[header] || '';
                let extra_cell;
                if (value === 'posted') {
                  let datevalue;
                  if (mapping.posted_format) {
                    try {
                      let dt = moment(row[header], mapping.posted_format);
                      if (dt.isValid()) {
                        datevalue = <DateDisplay value={dt} />  
                      } else {
                        datevalue = <span className="error">{sss('Invalid')}</span>
                      }
                    } catch(err) {
                      datevalue = <span className="error">{sss('Invalid')}</span>
                    }  
                  }
                  extra_cell = <td key={header+'formatted'} className="nobr">
                    {datevalue}
                  </td>
                } else if (value === 'amount') {
                  let money;
                  try {
                    money = <Money value={csvFieldToCents(row[header])} />
                  } catch(err) {
                    money = <span className="error">{sss('Invalid')}</span>
                  }
                  extra_cell = <td key={header+'parsed'} className="nobr">
                    {money}
                  </td>
                }
                return [
                  <td key={header}>{row[header]}</td>,
                  extra_cell,
                ]
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
    return <div>
      <p className="instructions">
        <span>{sss('Select the account these transactions belong to.')}</span> <span>{sss('edit.mapping', (onClick) => {
          return <span>Or <a href="#" onClick={onClick}>edit the mapping.</a></span>
        })((ev) => {
          ev.preventDefault();
          current_file.room.broadcast('csv_account_response', {
            id: obj.id,
            account_id: null,
            redo_mapping: true,
          })
        })}</span>
      </p>
      <p>
        <select
          value={account_id || ''}
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
        {account_id !== 'NEW' ? null : <input
          type="text"
          value={new_name}
          placeholder={sss('Account name')}
          onChange={ev => {
            this.setState({new_name: ev.target.value});
          }}/>}
        <button
          disabled={!account_id}
          onClick={async () => {
            if (account_id === 'NEW') {
              if (!new_name) {
                makeToast(sss('Provide a name for the new account.'), {className:'error'})
                return;
              }
              let new_account = await manager.checkpoint(sss('Create Account')).accounts.add(new_name);
              account_id = new_account.id;
            }
            current_file.room.broadcast('csv_account_response', {
              id: obj.id,
              account_id,
            })
          }}>
          {sss('Finish import')}
        </button>
      </p>
      <table className="ledger">
        <thead>
          <tr>
            <th>{sss('Posted')}</th>
            <th>{sss('Memo')}</th>
            <th>{sss('Amount')}</th>
          </tr>
        </thead>
        <tbody>
          {obj.transactions.map((trans, idx) => {
            return <tr key={idx}>
              <td><DateDisplay value={loadTS(trans.posted)} /></td>
              <td>{trans.memo}</td>
              <td><Money value={trans.amount} /></td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  }
}
