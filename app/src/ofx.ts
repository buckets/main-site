import * as _ from 'lodash'
import { Timestamp } from './time'
import { parse as parseOFX } from 'ofx-js'

interface ImportableTrans {
  account_label: string;
  amount:number;
  memo:string;
  posted:Timestamp;
  fi_id?:string;
  currency?:string;
}

export async function ofx2importable(ofx:string):Promise<ImportableTrans[]> {
  let parsed = await parseOFX(ofx);
  let ret = [];
  let fi_description = '';
  try {
    let fi = parsed.OFX.SIGNONMSGSRSV1.SONRS.FI;
    fi_description = `${fi.ORG} (${fi.FID})`;
  } catch(err) {
  }
  let currency;
  let account_description = '';
  let statement = parsed.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS;
  if (statement.CURDEF) {
    currency = statement.CURDEF.toLowerCase();
  }
  if (statement.BANKACCTFROM) {
    let acc = statement.BANKACCTFROM;
    account_description = `${acc.ACCTTYPE} (${acc.ACCTID})`;
  }
  if (statement.BANKTRANLIST) {
    let transactions;
    if (_.isArray(statement.BANKTRANLIST.STMTTRN)) {
      transactions = statement.BANKTRANLIST.STMTTRN;
    } else {
      transactions = [statement.BANKTRANLIST.STMTTRN];
    }
    console.log('transactions', transactions);
    ret = transactions.map((trans):ImportableTrans => {
      return {
        hey matt, you're right here
      };
    })
  }
  return ret;
}