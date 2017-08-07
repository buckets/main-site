import * as _ from 'lodash';
import * as moment from 'moment'
import { IStore } from '../store'
import { ts2db } from '../time'

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
    let ret:IntervalSummary[] = [];
    console.log('incomeAndExpenses', args);
    args.unit = args.unit || 'month';
    let p = args.start.clone()
    while (p.isBefore(args.end)) {
      let er = p.clone().add(<any>1, args.unit);

      let item:IntervalSummary = {
        start: p.clone(),
        end: er.clone(),
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
        $start: ts2db(p),
        $end: ts2db(er),
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
        $start: ts2db(p),
        $end: ts2db(er),
      })
      rows.forEach(row => {
        ensurePresent(item.accounts, row.account_id);
        item.accounts[row.account_id].expenses = row.expenses;
        item.expenses += row.expenses;
      })

      // balance
      let end_balances = await this.store.accounts.balances(er);
      _.each(end_balances, (balance, account_id) => {
        ensurePresent(item.accounts, account_id);
        item.accounts[account_id].end_balance = balance;
        item.end_balance += balance;
      })
      ret.push(item);
      p = er;
    }
    return ret;
  }
}

