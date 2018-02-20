import * as _ from 'lodash';
import * as moment from 'moment'
import { IStore } from '../store'
import { ts2db, tsfromdb, Interval, chunkTime } from '../time'

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
      $start: ts2db(start),
      $end: ts2db(end),
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
      $start: ts2db(start),
      $end: ts2db(end),
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
      $start: ts2db(start),
      $end: ts2db(end),
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
   *  Return the total of bucket expenses for a date range.
   */
  async bucketExpenses(args:{
    start: moment.Moment,
    end: moment.Moment,
    bucket_id: number,
  }):Promise<number> {
    let { start, end } = args;
    // expense
    let rows = await this.store.query(`
      SELECT
        SUM(amount) as expenses
      FROM bucket_transaction
      WHERE
        coalesce(transfer, 0) = 0
        AND posted >= $start
        AND posted < $end
        AND amount <= 0
        AND bucket_id = $bucket_id`, {
      $start: ts2db(start),
      $end: ts2db(end),
      $bucket_id: args.bucket_id,
    })
    return rows[0].expenses;
  }

  /**
   *  Get some historical averages and other data for a bucket
   */
  async bucketExpenseHistory(args:{
    end: moment.Moment;
    bucket_id: number;
  }):Promise<{
    interval: Interval;
    unit: 'month'|'year';
    intervals: Array<{
      interval: Interval;
      expenses: number;
      balance: {
        start: number;
        end: number;
      }
    }>
  }> {
    const SAMPLE = 12;
    const MONTHS = 18;
    const YEARS = 3;
    const { bucket_id, end } = args;

    // How far back should we go?
    let latest_expenses = await this.store.buckets.listTransactions({
      bucket_id,
      limit: SAMPLE,
      where: `coalesce(transfer, 0) = 0 AND amount <= 0`,
    })
    let farback_expense = latest_expenses.slice(-1)[0];
    if (farback_expense === undefined) {
      return null;
    }
    let start = tsfromdb(farback_expense.posted);
    let diff = end.diff(start, 'months');
    let unit:moment.unitOfTime.DurationConstructor = 'month';
    if (diff <= SAMPLE) {
      // monthly expense
      start = end.clone().subtract(MONTHS, 'months').startOf('month');
    } else {
      // not a monthly expense
      unit = 'year';
      start = end.clone().subtract(YEARS, 'years').startOf('year');
    }

    let running_bal = (await this.store.buckets.balances(start, bucket_id))[bucket_id];
    let intervals = await Promise.all(chunkTime({
      start,
      end,
      unit,
      clipEnd: true,
    })
    .map(async chunk => {
      let months = chunk.end.diff(chunk.start, 'month') || 1;
      const expenses = await this.bucketExpenses({
        start: chunk.start,
        end: chunk.end,
        bucket_id,
      }) / months;
      const end_bal = (await this.store.buckets.balances(chunk.end, bucket_id))[bucket_id];
      const start_bal = running_bal;
      running_bal = end_bal;
      return {
        interval: chunk,
        expenses: expenses,
        balance: {
          start: start_bal,
          end: end_bal,
        }
      }
    }));

    return {
      interval: {
        start,
        end,
      },
      unit,
      intervals,
    }
  }
}

