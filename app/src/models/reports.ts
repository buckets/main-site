import * as _ from 'lodash';
import * as moment from 'moment-timezone'
import { IStore } from '../store'
import { ts2utcdb, Interval, chunkTime } from '../time'

export interface IncomeExpenseSum {
  interval: Interval;
  end_balance: number;
  income: number;
  expenses: number;
  net_transfer: number;
}

export class ReportStore {
  constructor(private store:IStore) {

  }
  async incomeAndExpenses(args:{
    start: moment.Moment,
    end: moment.Moment,
  }):Promise<IncomeExpenseSum> {
    let { start, end } = args;
    let item:IncomeExpenseSum = {
      interval: {
        start: start.clone(),
        end: end.clone(),
      },
      income: 0,
      expenses: 0,
      end_balance: 0,
      net_transfer: 0,
    }
    
    // income
    let rows = await this.store.query(`
      SELECT
        SUM(amount) as income
      FROM account_transaction
      WHERE
        coalesce(general_cat, '') <> 'transfer'
        AND posted >= $start
        AND posted < $end
        AND amount > 0`, {
      $start: ts2utcdb(start),
      $end: ts2utcdb(end),
    })
    item.income = rows[0].income;

    // expense
    rows = await this.store.query(`
      SELECT
        SUM(amount) as expenses
      FROM account_transaction
      WHERE
        coalesce(general_cat, '') <> 'transfer'
        AND posted >= $start
        AND posted < $end
        AND amount <= 0`, {
      $start: ts2utcdb(start),
      $end: ts2utcdb(end),
    })
    item.expenses = rows[0].expenses

    // transfers
    rows = await this.store.query(`
      SELECT
        SUM(amount) as total
      FROM account_transaction
      WHERE
        posted >= $start
        AND posted < $end`, {
      $start: ts2utcdb(start),
      $end: ts2utcdb(end),
    })
    item.net_transfer = rows[0].total - item.income - item.expenses;

    // balance
    let end_balances = await this.store.accounts.balances(end);
    _.each(end_balances, (balance) => {
      item.end_balance += balance;
    })
    return item;
  }

  /**
   *  Get some historical averages and other data for a set of buckets
   */
  async bucketExpenseHistories(args:{
    interval: Interval;
    unit: 'month'|'year';
    bucket_ids: number[];
  }):Promise<{
    [bucket_id:number]: number[];
  }> {
    let intervals = chunkTime({
      start: args.interval.start,
      end: args.interval.end,
      step: 1,
      unit: args.unit,
      clipEnd: true,
    })
    let params = {};
    let bucket_ids = args.bucket_ids.join(',');
    let queries = intervals.map((interval, i) => {
      params[`$start${i}`] = ts2utcdb(interval.start);
      params[`$end${i}`] = ts2utcdb(interval.end);
      return `SELECT
        ${i} as ago,
        bucket_id,
        SUM(amount) as expenses
      FROM bucket_transaction
      WHERE
        coalesce(transfer, 0) = 0
        AND posted >= $start${i}
        AND posted < $end${i}
        AND amount <= 0
        AND bucket_id in (${bucket_ids})
      GROUP BY
        1,2`;
    })
    let incomplete = {};
    args.bucket_ids.forEach(bucket_id => {
      incomplete[bucket_id] = {};
    });
    let rows = await this.store.query(queries.join(' UNION ALL '),
      params);
    for (let row of rows) {
      incomplete[row.bucket_id][row.ago] = row.expenses;
    }
    let ret = {};
    args.bucket_ids.forEach(bucket_id => {
      ret[bucket_id] = intervals.map((interval, i) => {
        let months = interval.end.diff(interval.start, 'months') || 1;
        return incomplete[bucket_id][i]/months || 0;
      })
    })
    return ret;
  }
}

