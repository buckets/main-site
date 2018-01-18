import * as csv from 'csv'
import * as moment from 'moment'
import {v4 as uuid} from 'uuid'

import { decimal2cents } from './money'
import { ImportableAccountSet, ImportableTrans } from './importing'
import { CSVImportMapping } from './models/account'
import { IStore } from './store'
import { current_file } from './mainprocess/files'
import { hashStrings } from './util'




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
  let result = decimal2cents(x.replace(/[^0-9\.,]/g, ''));
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

export async function csv2importable(store:IStore, guts:string):Promise<ImportableAccountSet> {
  const parsed = await parseCSVStringWithHeader(guts);
  const fingerprint = hashStrings(parsed.headers);
  let csv_mapping = await store.accounts.getCSVMapping(fingerprint);
  if (csv_mapping === null) {
    // no current mapping
    let need:CSVNeedsMapping = {
      id: uuid(),
      parsed_data: parsed,
    };
    current_file.room.broadcast('csv_needs_mapping', need);
    csv_mapping = await new Promise<CSVImportMapping>((resolve, reject) => {
      current_file.room.events('csv_has_mapping').onceSuccessfully(async message => {
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
  let hashcount = {};
  const transactions = parsed.rows.map((row):ImportableTrans => {
    const amount = csvFieldToCents(row[mapping.amount]);
    const memo = row[mapping.memo];
    const posted = moment(row[mapping.posted], mapping.posted_format);
    let fi_id;
    if (mapping.fi_id) {
      fi_id = row[mapping.fi_id];
    } else {
      // Generate an id based on transaction details
      let rowhash = hashStrings([amount.toString(), memo, posted.format()])
      
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

  // Get an account id
  const need:CSVNeedsAccountAssigned = {
    id: uuid(),
    transactions,
  }
  current_file.room.broadcast('csv_needs_account_assigned', need);
  const account_id = await new Promise<number>((resolve, reject) => {
    current_file.room.events('csv_has_account_assigned').onceSuccessfully(msg => {
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



