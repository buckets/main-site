import * as _ from 'lodash'
import * as moment from 'moment'
import { parse as parseOFX } from 'ofx-js'
import { decimal2cents } from './money'
import { ImportableTrans } from './budget/importing'


let formats = [
  'YYYYMMDDHHmmss.SSS',
  'YYYYMMDDHHmmss',
  'YYYYMMDD',
]
function parseOFXDate(x:string):moment.Moment {
  let ret = moment.utc(x, formats);
  return ret;
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
  let statement;
  let tranlist;
  if (parsed.OFX.BANKMSGSRSV1) {
    // bank account
    statement = parsed.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS;
    if (statement.CURDEF) {
      currency = statement.CURDEF;
    }
    if (statement.BANKACCTFROM) {
      let acc = statement.BANKACCTFROM;
      account_description = `${acc.ACCTTYPE} (${acc.ACCTID})`;
    }
    tranlist = statement.BANKTRANLIST;
  } else if (parsed.OFX.CREDITCARDMSGSRSV1) {
    // credit card
    statement = parsed.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS;
    if (statement.CURDEF) {
      currency = statement.CURDEF;
    }
    if (statement.CCACCTFROM) {
      let acc = statement.CCACCTFROM;
      let parts = [];
      if (acc.ACCTTYPE) {
        parts.push(acc.ACCTTYPE)
      }
      if (acc.ACCTID) {
        parts.push(acc.ACCTID);
      }
      account_description = parts.join(' ');
    }
    tranlist = statement.BANKTRANLIST;
  }
  
  if (tranlist) {
    let transactions;
    if (_.isArray(statement.BANKTRANLIST.STMTTRN)) {
      transactions = statement.BANKTRANLIST.STMTTRN;
    } else {
      transactions = [statement.BANKTRANLIST.STMTTRN];
    }
    ret = transactions.map((trans):ImportableTrans => {
      let account_label = account_description;
      if (fi_description) {
        account_label += ' ' + fi_description;
      }
      return {
        account_label: account_label,
        amount: decimal2cents(trans.TRNAMT),
        memo: trans.MEMO || trans.NAME,
        posted: parseOFXDate(trans.DTPOSTED),
        fi_id: trans.FITID,
        currency: currency,
      };
    })
  }
  return ret;
}