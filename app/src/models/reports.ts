import * as _ from 'lodash';
import * as moment from 'moment'
import { IStore } from '../store'
import { ts2db } from '../time'

export interface IncomeExpenseSum {
  interval: Interval;
  end_balance: number;
  income: number;
  expenses: number;
}

interface Interval {
  start: moment.Moment,
  end: moment.Moment,
}

export function chunkTime(args: {
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
    }
    
    // income
    let rows = await this.store.query(`
      SELECT
        SUM(amount) as income
      FROM account_transaction
      WHERE
        general_cat='income'
        AND posted >= $start
        AND posted < $end`, {
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
        (general_cat is null
         OR general_cat = '')
        AND posted >= $start
        AND posted < $end
        AND amount <= 0`, {
      $start: ts2db(start),
      $end: ts2db(end),
    })
    item.expenses = rows[0].expenses

    // balance
    let end_balances = await this.store.accounts.balances(end);
    _.each(end_balances, (balance) => {
      item.end_balance += balance;
    })
    return item;
  }
}

