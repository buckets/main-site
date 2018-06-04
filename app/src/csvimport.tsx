import * as React from 'react'
import * as csv from 'csv'
import * as moment from 'moment-timezone'
import {v4 as uuid} from 'uuid'

import { manager } from './budget/appstate'
import { sss } from './i18n'
import { NUMBER_FORMATS, NUMBER_FORMAT_EXAMPLES, NumberFormat } from './langs/spec'
import { Money, decimal2cents } from './money'
import { SEPS, ISeps } from 'buckets-core/dist/money'
import { parseLocalTime, dumpTS, loadTS } from 'buckets-core/dist/time'
import { DateDisplay } from './time'
import { ImportableAccountSet, ImportableTrans } from './importing'
import { Account } from './models/account'
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
export async function parseCSVStringWithHeader<T>(guts:string, opts:{
  delimiter: string,
}={
  delimiter: ','
}):Promise<ParsedCSV<T>> {
  return new Promise<ParsedCSV<T>>((resolve, reject) => {
    let headers:string[] = [];
    csv.parse(guts, {
      relax_column_count: true,
      delimiter: opts.delimiter,
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

export function csvFieldToCents(x:string, seps?:ISeps) {
  if (!x) {
    return 0;
  }
  x = x.replace(/[^-\(\)0-9\.,]/g, '')
  if (x.startsWith('(') && x.endsWith(')')) {
    x = `-${x.substr(1, x.length-1)}`;
  }
  return decimal2cents(x, {
    seps: seps || undefined,
  });
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
  amount: string[],
  memo: string[],
  posted: string[],
  fi_id: string[],
  amount_sign: string[],
  '': string[],
} {
  let inverted_mapping = {
    amount: [],
    memo: [],
    posted: [],
    fi_id: [],
    amount_sign: [],
    '': [],
  };
  try {
    Object.keys(mapping.fields).sort().forEach(header => {
      const val = mapping.fields[header];
      inverted_mapping[val].push(header);  
    })
  } catch(err) {
    log.info('mapping', mapping);
    log.info('inverted_mapping so far', inverted_mapping);
    throw err;
  }
  return inverted_mapping;
}

/**
 *  Format of mapping stored in database
 */
export interface CSVMapping {
  fields: {
    [field:string]: 'amount'|'memo'|'posted'|'fi_id'|'amount_sign';
  }
  posted_format?: string;
  noheader?: boolean;
  numberformat?: NumberFormat;
  negative_signifier?: string;
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


function getDataRows<T>(parsed:ParsedCSV<T>, mapping:CSVMapping):T[] {
  let ret = [];
  if (mapping.noheader) {
    let header_obj = {};
    parsed.headers.forEach(column => {
      header_obj[column] = column;
    })
    ret.push(header_obj);
  }
  parsed.rows.forEach(row => {
    ret.push(row);
  })
  return ret;
}

export async function csv2importable(store:IStore, bf:IBudgetFile, guts:string, args:{
  force_mapping?:boolean,
  delimiter?:string,
} = {}):Promise<ImportableAccountSet> {
  log.info('csv2importable', guts.length);
  const delimiter = args.delimiter || ','
  const parsed = await parseCSVStringWithHeader(guts, {
    delimiter,
  });
  if (parsed.headers.length < 3) {
    // Invalid CSV file
    throw new Error('Not enough columns in CSV file')
  }
  const fingerprint = hashStrings(parsed.headers);
  log.info('fingerprint', fingerprint);
  let csv_mapping = await store.sub.accounts.getCSVMapping(fingerprint);
  let mapping:CSVMapping;
  if (csv_mapping === null || args.force_mapping) {
    // no current mapping
    let need:CSVNeedsMapping = {
      id: uuid(),
      parsed_data: parsed,
      current_mapping: csv_mapping ? JSON.parse(csv_mapping.mapping_json) : undefined,
    };
    bf.room.broadcast('csv_needs_mapping', need);
    mapping = await new Promise<CSVMapping>((resolve, reject) => {
      bf.room.events('csv_mapping_response').untilTrue(async message => {
        if (message.id === need.id) {
          // now there's a mapping
          let new_mapping:CSVMapping;
          if (!message.mapping.noheader) {
            // There's a header; save the mapping with the fingerprint
            const csv_mapping = await store.sub.accounts.setCSVMapping(fingerprint, message.mapping);
            new_mapping = JSON.parse(csv_mapping.mapping_json) as CSVMapping;
          } else {
            // There's no header; we don't yet have a good way to fingerprint this
            new_mapping = message.mapping;
          }
          resolve(new_mapping);
          return true;
        }
        // wrong object
        return false;
      })
    });
  } else {
    mapping = JSON.parse(csv_mapping.mapping_json) as CSVMapping;
  }

  // Use the mapping
  log.info('mapping', mapping);
  let hashcount = {};
  let inverted_mapping = invertMapping(mapping);
  const numberformatdef = mapping.numberformat ? NUMBER_FORMATS[mapping.numberformat] : SEPS;
  const transactions = getDataRows(parsed, mapping).map((row):ImportableTrans => {
    let sign = 1;
    if (inverted_mapping.amount_sign.length) {
      let amount_sign_header = inverted_mapping.amount_sign.slice(-1)[0];
      if (row[amount_sign_header] === mapping.negative_signifier) {
        sign = -1;
      }
    }
    const amount = sign * csvFieldToCents(
      inverted_mapping.amount
        .map(key => row[key])
        .filter(x=>x)[0],
      numberformatdef);
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
    bf.room.events('csv_account_response').untilTrue(msg => {
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
    return await csv2importable(store, bf, guts, {
      force_mapping: true,
      delimiter,
    });
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
      noheader: false,
      seps: undefined,
      negative_signifier: undefined,
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
      format_options: string[],
    } = {
      format_options: [],
    };
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

    const inverted = invertMapping(mapping);

    return <div>
      <ol className="instructions">
        <li>{sss('Identify the data each column contains using the drop downs below.')}</li>
        <li>{sss('You must have at least one column each set to Amount, Memo and Date Posted.')}</li>
        <li>{sss('For Date Posted, you must also choose the date format.')}</li>
        <li>{sss('If multiple columns are selected for Amount, the first non-zero value will be used.  This is helpful if the CSV contains separate Credit and Debit columns.')}</li>
        <li>{sss('Only select a column for Unique ID if you are sure it contains bank-assigned, unique transaction IDs.  Most CSVs will not have this field.')}</li>
        <li>{sss('Click the "Set mapping" to continue.')}</li>
      </ol>
      <div>
        <label>
          <input
            type="checkbox"
            checked={!this.state.mapping.noheader}
            onChange={ev => {
              let new_mapping = Object.assign(mapping, {
                noheader: !ev.target.checked,
              })
              this.setState({mapping: new_mapping})
            }}/>
          {sss('Header row'/* Label for checkbox indicating whether a CSV file has a header row or not */)}
        </label>
      </div>
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
                      const newvalue = ev.target.value;
                      let new_fields = Object.assign(mapping.fields, {
                        [header]: newvalue,
                      })
                      let new_mapping = Object.assign(mapping, {
                        fields: new_fields,
                      })

                      let newstate:any = {mapping: new_mapping}

                      if (newvalue === 'posted') {
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
                    <option value="amount_sign">{sss('Sign'/* Noun referring to the sign of a number (positive or negative) */)} {sss('(optional)')}</option>
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
                {value === 'amount' ? <div>
                  <select
                    value={mapping.numberformat}
                    onChange={ev => {
                      this.setState({mapping: Object.assign(mapping, {
                        numberformat: ev.target.value as NumberFormat,
                      })})
                    }}>
                    <option value="">{sss('Language default')}</option>
                    <option value="comma-period">{NUMBER_FORMAT_EXAMPLES['comma-period']}</option>
                    <option value="period-comma">{NUMBER_FORMAT_EXAMPLES['period-comma']}</option>
                    <option value="space-comma">{NUMBER_FORMAT_EXAMPLES['space-comma']}</option>
                  </select>
                </div> : null}
                {value === 'amount_sign' ? <div>
                  {sss('Negative'/* Label for choosing the word/symbol that signifies a negative number */)} <select
                    value={mapping.negative_signifier || ''}
                    onChange={ev => {
                      this.setState({mapping: Object.assign(mapping, {
                        negative_signifier: ev.target.value,
                      })})
                    }}>
                    <option value=""></option>
                    {getDataRows(obj.parsed_data, mapping)
                      .map(row => row[header])
                      .reduce((prev:string[], current) => {
                        if (prev.indexOf(current) === -1) {
                          prev.push(current)
                        }
                        return prev;
                      }, [])
                      .map(option => {
                        return <option key={option}>{option}</option>
                      })
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
        </thead>
        <tbody>
          { this.state.mapping.noheader
            ? null
            : <tr>
              {obj.parsed_data.headers.map(header => {
                let value = mapping.fields[header] || '';
                const colspan = value === 'posted'|| value === 'amount' ? 2 : 1;
                return <th key={header} colSpan={colspan}>{header}</th>
              })}
            </tr>
          }
          {getDataRows(obj.parsed_data, this.state.mapping).map((row, idx) => {
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
                  let sign = 1;
                  if (inverted.amount_sign.length) {
                    let amount_sign_header = inverted.amount_sign.slice(-1)[0];
                    if (row[amount_sign_header] === mapping.negative_signifier) {
                      sign = -1;
                    }
                  }
                  try {
                    money = <Money
                      value={sign * csvFieldToCents(row[header],
                        mapping.numberformat ? NUMBER_FORMATS[mapping.numberformat] : SEPS)}
                      noanimate
                    />
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
              let new_account = await manager.checkpoint(sss('Create Account')).sub.accounts.add(new_name);
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
              <td><Money value={trans.amount} noanimate /></td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  }
}
