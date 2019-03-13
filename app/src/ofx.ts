import * as moment from 'moment-timezone'
import { parse as parseOFX } from 'ofx-js'
import { dumpTS, loadTS } from 'buckets-core/dist/time'
import { decimal2cents } from './money'
import { ImportableTrans, ImportableAccountSet } from './importing'
import { PrefixLogger } from './logging'
import { TransactionIDGenerator } from './genfiid'

const log = new PrefixLogger('(ofx)')


namespace OFX {
  export interface CCSTMTTRNRS {
    TRNUID?: number;
    CCSTMTRS?: {
      CURDEF?: string;
      BANKTRANLIST: BANKTRANLIST;
      CCACCTFROM: {
        ACCTID?: string;
        ACCTTYPE?: string;
      }
    }
  }
  export interface STMTTRNRS {
    TRNUID?: number;
    STMTRS?: {
      CURDEF?: string;
      BANKTRANLIST: BANKTRANLIST;
      BANKACCTFROM?: {
        BANKID?: string;
        ACCTID?: string;
        ACCTTYPE?: string;
      };
      LEDGERBAL?: {
        BALAMT?: string;
        DTASOF?: string;
      };
      AVAILBAL?: {
        BALAMT?: string;
        DTASOF?: string;
      };
    }
  }
  export interface STMTTRN {
    TRNAMT: string;
    MEMO?: string;
    NAME?: string;
    DTPOSTED: string;
    FITID?: string;
  }
  export interface BANKTRANLIST {
    STMTTRN?: STMTTRN|STMTTRN[];
  }
  
  export interface File {
    header: {
      OFXHEADER: string;
    };
    OFX: {
      SIGNONMSGSRSV1?: {
        SONRS?: {
          FI?: {
            ORG: string;
            FID: string;
          }
        }
      };
      BANKMSGSRSV1?: {
        STMTTRNRS?: STMTTRNRS|STMTTRNRS[];
      };
      CREDITCARDMSGSRSV1?: {
        CCSTMTTRNRS?: CCSTMTTRNRS|CCSTMTTRNRS[];
      };
    }
  }
}


let formats = [
  // 'YYYYMMDDHHmmss.SSS[Z]',
  'YYYYMMDDHHmmss.SSS',
  // 'YYYYMMDDHHmmss[Z]',
  'YYYYMMDDHHmmss',
  'YYYYMMDD',
]
function parseOFXDate(x:string):moment.Moment {
  let ret = moment.utc(x, formats).tz('UTC');
  // Get goofy timezones
  let m = /\[([\+|\-]\d+(?::?\d+)?).*?\]/.exec(x);
  if (m) {
    let offset = 0;
    let offset_string = m[1];
    if (offset_string.indexOf(":") !== -1) {
      // +HH:MM
      // +H:MM
      let [h, m] = offset_string.split(":");
      offset += Math.abs(Number(h) * 60);
      offset += Math.abs(Number(m));
    } else {
      if (offset_string.length <= 3) {
        // +H
        // +HH
        offset += Math.abs(Number(offset_string) * 60);
      } else {
        // +HMM
        // +HHMM
        offset += Number(offset_string.substr(-2));
        offset += Math.abs(Number(offset_string.substr(0, offset_string.length-2)) * 60);
      }
    }
    if (offset_string.startsWith("-")) {
      offset *= -1;
    }
    ret.add(-offset, "minutes");
  }
  return ret;
}

function alwaysArray<T>(x:T|T[]):T[] {
  return [].concat(x);
}

function getTransactions(tranlist:OFX.BANKTRANLIST, fiGenerator:TransactionIDGenerator):ImportableTrans[] {
  const transactions = alwaysArray(tranlist.STMTTRN).filter(x => x);
  return transactions.map((trans):ImportableTrans => {
    let amount = decimal2cents(trans.TRNAMT);
    let memo = trans.MEMO || trans.NAME;
    let posted = dumpTS(parseOFXDate(trans.DTPOSTED));
    let fi_id = trans.FITID
    if (!fi_id) {
      // Generate an id based on transaction details
      fi_id = fiGenerator.makeID([
        amount ? amount.toString() : '',
        memo ? memo : '',
        posted ? loadTS(posted).toISOString() || '' : '',
      ])
    }
    return {amount, memo, posted, fi_id};
  })
}

export async function ofx2importable(ofx:string):Promise<ImportableAccountSet> {
  log.info('Parsing OFX data', ofx.length);
  // Some banks only include FITIDs on some transactions.  Hosers.
  ofx = ofx.replace(/<FITID>\s*</g, "<");
  let fiGenerator = new TransactionIDGenerator();

  let parsed:OFX.File = await parseOFX(ofx);
  if (parsed.OFX === undefined || parsed.OFX === 'undefined' || Object.keys(parsed.OFX).length === 0) {
    throw new Error('Not a valid OFX file');
  }
  let ret:ImportableAccountSet = {
    accounts: [],
  };
  let fi_description:string;
  try {
    let fi = parsed.OFX.SIGNONMSGSRSV1.SONRS.FI;
    fi_description = `${fi.ORG} (${fi.FID})`;
  } catch(err) {
  }

  if (parsed.OFX.BANKMSGSRSV1) {
    // bank account
    const accountdefs = alwaysArray(parsed.OFX.BANKMSGSRSV1.STMTTRNRS);
    for (const accountdef of accountdefs) {
      let statement = accountdef.STMTRS;
      let currency: string;
      if (statement) {
        let account_description:string;
        if (statement.CURDEF) {
          currency = statement.CURDEF;
        }
        if (statement.BANKACCTFROM) {
          let acc = statement.BANKACCTFROM;
          account_description = `${acc.ACCTTYPE} (${acc.ACCTID})`;
        }
        if (fi_description) {
          account_description += ' ' + fi_description;
        }
        let transactions = getTransactions(statement.BANKTRANLIST, fiGenerator);
        ret.accounts.push({
          label: account_description,
          transactions,
          currency,
        })
      }
    }
  }

  if (parsed.OFX.CREDITCARDMSGSRSV1) {
    // credit card
    const accountdefs = alwaysArray(parsed.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS);
    for (const accountdef of accountdefs) {
      let statement = accountdef.CCSTMTRS;
      let currency: string;
      if (statement) {
        let account_description:string;
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
        if (fi_description) {
          account_description += ' ' + fi_description;
        }
        let transactions = getTransactions(statement.BANKTRANLIST, fiGenerator);
        ret.accounts.push({
          label: account_description,
          transactions,
          currency,
        })
      }
    }
  }
  return ret;
}