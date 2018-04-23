import * as moment from 'moment-timezone'
import {IStore} from '../store'
import { ts2localdb, localNow } from '../time'
import {sanitizeDbFieldName} from '../mainprocess/dbstore'

export class Balances {
  [k:number]: number;
}

export async function computeBalances(
  store:IStore,
  account_table:string,
  transaction_table:string,
  join_column:string,
  asof?:moment.Moment,
  where?:string,
  params?:object):Promise<Balances> {
  let prm:any = params || {};
  if (!asof) {
    // get the balance as of tomorrow
    asof = localNow().add(1, 'day')
  }
  if (where) {
    where = `WHERE ${where}`;
  } else {
    where = '';
  }
  let sql = `
    SELECT
      a.id, a.balance - sum(coalesce(t.amount,0)) as balance, sum(t.amount)
    FROM
      ${sanitizeDbFieldName(account_table)} as a
      left join ${sanitizeDbFieldName(transaction_table)} as t
        on a.id = t.${sanitizeDbFieldName(join_column)}
           AND t.posted >= $asof
    ${where}
    GROUP BY 1
  `;
  prm.$asof = ts2localdb(asof);
  let rows = await store.query(sql, prm);
  let ret:Balances = {};
  rows.forEach(row => {
    ret[row.id] = row.balance;
  })
  return ret;
}