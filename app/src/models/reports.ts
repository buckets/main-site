import * as _ from 'lodash';
import * as moment from 'moment'
import { IStore } from '../store'
import { ts2db, Interval } from '../time'

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
   *  Get some data to help suggest a good rain amount to keep up with expenses
   *  and keep the balance positive.
   */
  // async analyzeRainNeeds(args:{
  //   end: moment.Moment;
  //   bucket_id: number;
  // }):Promise<{
  //   interval: Interval;
  //   intervals: Array<{
  //     interval: Interval;
  //     expense_count: number;
  //     expenses: number;
  //     balance: {
  //       start: number;
  //       end: number;
  //     }
  //   }>
  // }> {
  //   const { bucket_id, end } = args;
  //   const yearago = end.clone().subtract(12, 'months');
  //   let expense_count_last12 = await this.store.buckets.countTransactions(bucket_id, {start: yearago, end}, `
  //       coalesce(transfer, 0) = 0
  //       AND amount <= 0`)

  //   let start:moment.Moment;
  //   if (expense_count_last12 >= 12) {
  //     // monthly expenses
  //     start = end.clone().subtract(3, 'months');
  //   } else {
  //     // something less frequent than monthly
  //     start = yearago;
  //   }
  //   let latest_transactions = await this.store.buckets.listTransactions({
  //     bucket_id,
  //     limit: 12,
  //     where: `
  //       coalesce(transfer, 0) = 0
  //       AND amount <= 0`,
  //   })
  //   if (!latest_transactions.length) {
  //     return null;
  //   }
  //   let earliest = latest_transactions.slice(-1)[0];


  //   // const expense_span = await this.store.buckets.transactionSpan(bucket_id, args.interval,
  //   //   `coalesce(transfer, 0) = 0
  //   //    AND amount <= 0`);
  //   // if (expense_span === null) {
  //   //   // No expense data in this range
  //   //   return 0;
  //   // }

  //   // let { end } = expense_span;
  //   // end.startOf('month').add(1, 'month');
    
  //   // const expenses = await this.bucketExpenses({
  //   //   bucket_id,
  //   //   start,
  //   //   end,
  //   // })
  //   // const start_bal = (await this.store.buckets.balances(start, bucket_id))[bucket_id];
  //   // const months = end.diff(start, 'month');
  //   // console.log(`${bucket_id} expenses: ${expenses} months: ${months} startbal: ${start_bal}`)
  //   // return Math.abs(expenses) / months;

  //   // let running_bal = (await this.store.buckets.balances(start, bucket_id))[bucket_id];
  //   // let intervals = await Promise.all(chunkTime({
  //   //   start,
  //   //   end,
  //   //   unit: 'month',
  //   // })
  //   // .map(async chunk => {
  //   //   const expenses = await this.bucketExpenses({
  //   //     start: chunk.start,
  //   //     end: chunk.end,
  //   //     bucket_id,
  //   //   })
  //   //   const end_bal = (await this.store.buckets.balances(chunk.end, bucket_id))[bucket_id];
  //   //   const start_bal = running_bal;
  //   //   running_bal = end_bal;
  //   //   return {
  //   //     interval: chunk,
  //   //     expenses: expenses,
  //   //     expense_count: null,
  //   //     balance: {
  //   //       start: start_bal,
  //   //       end: end_bal,
  //   //     }
  //   //   }
  //   // }));

  //   return {
  //     intervals,
  //   }

  //   // const start_bal = ;
  //   // const end_bal = (await this.store.buckets.balances(end, bucket_id))[bucket_id];
  //   // const bal_diff = start_bal - end_bal;
  //   // const months = end.diff(start, chunkunit) || 1;
  //   // console.log(`bucket ${bucket_id} bal:[${start_bal},${end_bal}] diff=${bal_diff} months=${months}`)
  //   // return bal_diff / months;
  // }
}

