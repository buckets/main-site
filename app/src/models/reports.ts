import * as _ from 'lodash';
import * as moment from 'moment'
import { IStore } from '../store'
import { ts2db, Interval, chunkTime } from '../time'

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
   *  
   */
  async bucketExpenseHistory(args:{
    interval: Interval;
    bucket_id: number;
  }):Promise<{
    intervals: Array<{
      interval: Interval;
      expenses: number;
      balance: {
        start: number;
        end: number;
      }
    }>
  }> {
    const { bucket_id, interval } = args;
    const { start, end } = interval;

    let running_bal = (await this.store.buckets.balances(start, bucket_id))[bucket_id];
    let intervals = await Promise.all(chunkTime({
      start,
      end,
      unit: 'month',
    })
    .map(async chunk => {
      const expenses = await this.bucketExpenses({
        start: chunk.start,
        end: chunk.end,
        bucket_id,
      })
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
      intervals,
    }
  }
}

