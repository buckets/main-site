import * as moment from 'moment-timezone'
import { parse as parseOFX } from 'ofx-js'
import { dumpTS } from 'buckets-core/dist/time'
import { decimal2cents } from './money'
import { ImportableTrans, ImportableAccountSet } from './importing'
import { PrefixLogger } from './logging'

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
  'YYYYMMDDHHmmss.SSS',
  'YYYYMMDDHHmmss',
  'YYYYMMDD',
]
function parseOFXDate(x:string):moment.Moment {
  let ret = moment.utc(x, formats).tz('UTC');
  return ret;
}

function alwaysArray<T>(x:T|T[]):T[] {
  return [].concat(x);
}

function getTransactions(tranlist:OFX.BANKTRANLIST):ImportableTrans[] {
  const transactions = alwaysArray(tranlist.STMTTRN).filter(x => x);
  return transactions.map((trans):ImportableTrans => {
    return {
      amount: decimal2cents(trans.TRNAMT),
      memo: trans.MEMO || trans.NAME,
      posted: dumpTS(parseOFXDate(trans.DTPOSTED)),
      fi_id: trans.FITID,
    };
  })
}

export async function ofx2importable(ofx:string):Promise<ImportableAccountSet> {
  // XXX this does not handle the case where there are multiple accounts in a single file.
  log.info('Parsing OFX data', ofx.length);
  let parsed:OFX.File = await parseOFX(ofx);
  if (parsed.header.OFXHEADER === undefined) {
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
        let transactions = getTransactions(statement.BANKTRANLIST);
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
        let transactions = getTransactions(statement.BANKTRANLIST);
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