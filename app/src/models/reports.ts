import * as _ from 'lodash';
import * as moment from 'moment'
import { IStore } from '../store'
import { ts2db } from '../time'

export interface AccountIntervalSummary {
  start: moment.Moment;
  end: moment.Moment;
  end_balance: number;
  income: number;
  expenses: number;
}

interface AccountIESummary {
  account_id: number;
  income: number;
  expenses: number;
  end_balance: number;
}

export interface IntervalSummary {
  start: moment.Moment,
  end: moment.Moment,
  income: number,
  expenses: number,
  end_balance: number,
  accounts: {
    [k:number]: AccountIESummary;
  }
}


interface Interval {
  start: moment.Moment,
  end: moment.Moment,
}

function splitInterval(args: {
  start: moment.Moment,
  end: moment.Moment,
  unit?: string,
  step?: number,
}):Interval[] {
  let ret = [];
  args.unit = args.unit || 'month';
  args.step = args.step || 1
  let p = args.start.clone()
  while (p.isSameOrBefore(args.end)) {
    let er = p.clone().add(<any>args.step, args.unit);
    ret.push({
      start: p.clone(),
      end: er.clone(),
    })
    p = er;
  }
  return ret;
}


export class ReportStore {
  constructor(private store:IStore) {

  }
  async incomeAndExpenses(args:{
    start: moment.Moment,
    end: moment.Moment,
    unit?: string,
  }) {
    function ensurePresent(accounts:{[k:number]:AccountIESummary}, account_id:number) {
      if (accounts[account_id] === undefined) {
        accounts[account_id] = {
          income: 0,
          expenses: 0,
          end_balance: 0,
          account_id: account_id
        }
      }
    }
    let promises = splitInterval({start:args.start, end:args.end, unit:args.unit}).map(async range => {
      let item:IntervalSummary = {
        start: range.start.clone(),
        end: range.end.clone(),
        accounts: {},
        income: 0,
        expenses: 0,
        end_balance: 0,
      }
      
      // income
      let rows = await this.store.query(`
        SELECT
          account_id,
          SUM(amount) as total
        FROM account_transaction
        WHERE
          general_cat='income'
          AND posted >= $start
          AND posted < $end
        GROUP BY
          account_id`, {
        $start: ts2db(range.start),
        $end: ts2db(range.end),
      })
      rows.forEach(row => {
        ensurePresent(item.accounts, row.account_id);
        item.accounts[row.account_id].income = row.total;
        item.income += row.total;
      })

      // expense
      rows = await this.store.query(`
        SELECT
          account_id,
          SUM(amount) as expenses
        FROM account_transaction
        WHERE
          (general_cat is null
           OR general_cat = '')
          AND posted >= $start
          AND posted < $end
          AND amount <= 0
        GROUP BY
          account_id`, {
        $start: ts2db(range.start),
        $end: ts2db(range.end),
      })
      rows.forEach(row => {
        ensurePresent(item.accounts, row.account_id);
        item.accounts[row.account_id].expenses = row.expenses;
        item.expenses += row.expenses;
      })

      // balance
      let end_balances = await this.store.accounts.balances(range.end);
      _.each(end_balances, (balance, account_id) => {
        ensurePresent(item.accounts, account_id);
        item.accounts[account_id].end_balance = balance;
        item.end_balance += balance;
      })
      return item;
    });
    return Promise.all(promises);
  }

  async bucketHistory(args:{
    bucket_id: number,
    start: moment.Moment,
    end: moment.Moment,
    unit?: string,
  }):Promise<AccountIntervalSummary[]> {
    return Promise.all(splitInterval({
      start: args.start,
      end: args.end,
      unit: args.unit,
    }).map(async range => {
      // income
      let rows = await this.store.query(`
        SELECT
          SUM(amount) as income
        FROM
          bucket_transaction
        WHERE
          (transfer = 0 OR transfer is null)
          AND posted >= $start
          AND posted < $end
          AND amount > 0
          AND bucket_id=$bucket_id
        `, {
          $bucket_id: args.bucket_id,
          $start: ts2db(range.start),
          $end: ts2db(range.end),
        })
      let income = rows[0].expenses;

      // expenses
      rows = await this.store.query(`
        SELECT
          SUM(amount) as expenses
        FROM
          bucket_transaction
        WHERE
          (transfer = 0 OR transfer is null)
          AND posted >= $start
          AND posted < $end
          AND amount <= 0
          AND bucket_id=$bucket_id
        `, {
          $bucket_id: args.bucket_id,
          $start: ts2db(range.start),
          $end: ts2db(range.end),
        })
      let expenses = rows[0].expenses;

      // end_balance
      let bals = await this.store.buckets.balances(range.end, args.bucket_id);

      return {
        start: range.start,
        end: range.end,
        end_balance: bals[args.bucket_id],
        income,
        expenses,
      }
    }))
  }
}

