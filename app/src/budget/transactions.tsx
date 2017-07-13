'use strict';
import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import * as moment from 'moment'
import {manager, AppState} from './appstate'
import {Account, Category, Transaction} from '../models/account'
import {Date, DateInput, ensureUTCMoment} from '../time'
import {Money, MoneyInput} from '../money'


interface TransactionPageProps {
  appstate: AppState;

}
export class TransactionPage extends React.Component<TransactionPageProps, {
  show_subset: boolean;
  subset: number[];
}> {
  constructor(props) {
    super(props)
    this.state = {
      show_subset: false,
      subset: [],
    }
  }
  componentWillReceiveProps(nextProps:TransactionPageProps) {
    if (this.state.show_subset) {
      // we're in a filtering mood
      if (this.state.subset.length) {
        let sample = this.state.subset[0];
        if (!nextProps.appstate.transactions[sample]) {
          // we have a different set of transactions
          this.freezeShownTransactions(nextProps);
        }
      } else {
        // we're filtering but there's nothing in the list
        this.freezeShownTransactions(nextProps);
      }
    }
  }
  showUncategorized = (ev) => {
    // the showcategorized button was pressed
    let show_uncategorized = ev.target.checked;
    if (show_uncategorized) {
      // only show the categorized
      this.freezeShownTransactions(this.props);
    } else {
      // show all
      this.setState({
        show_subset: false,
        subset: [],
      })
    }
  }
  freezeShownTransactions(props) {
    let subset = props.appstate.uncategorized_trans.map(t=>t.id);
    this.setState({
      show_subset: true,
      subset: subset,
    })
  }
  render() {
    let transactions;
    let { appstate } = this.props;
    if (this.state.show_subset) {
      transactions = this.state.subset
        .map(id => appstate.transactions[id])
        .filter(x => x);
    } else {
      transactions = _.values(appstate.transactions);
    }
    return (
    <div className="rows">
      <div className="subheader">
        <div className="group">
          <div className="control">
            <input
              type="checkbox"
              checked={this.state.show_subset} 
              onChange={this.showUncategorized} /> Show uncategorized
          </div>
        </div>
      </div>
      <div className="panes">
        <div className="padded">
          <TransactionList
            appstate={appstate}
            transactions={transactions}
          />
        </div>
      </div>
    </div>);
  }
}

interface TransactionListProps {
  transactions: Transaction[];
  appstate: AppState;
  hideAccount?: boolean;
  account?: Account;
}
export class TransactionList extends React.Component<TransactionListProps, any> {
  render() {
    let { appstate, account } = this.props;
    let hideAccount = this.props.hideAccount || false;
    let elems = _.sortBy(this.props.transactions, [
      item => -ensureUTCMoment(item.posted).unix(),
      'account_id',
      'id',
    ])
    .map(trans => {
      return <tr key={trans.id}>
        <td className="nobr"><Date value={trans.posted} /></td>
        {hideAccount ? null : <td>{appstate.accounts[trans.account_id].name}</td>}
        <td>{trans.memo}</td>
        <td className="right"><Money value={trans.amount} /></td>
        <td><Categorizer
          transaction={trans}
          appstate={appstate} /></td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th className="nobr">Posted</th>
          {hideAccount ? null : <th>Account</th>}
          <th>Memo</th>
          <th>Amount</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
        <CreateTransRow
          hideAccount={hideAccount}
          account={account}
          appstate={appstate} />
        {elems}
      </tbody>
    </table>
  }
}

class CreateTransRow extends React.Component<{
  account?: Account;
  hideAccount?: boolean;
  appstate: AppState
}, {
  amount: number;
  memo: string;
  posted: moment.Moment;
  account_id: number;
}> {
  private memo_elem = null;
  private amount_elem = null;
  constructor(props) {
    super(props);
    this.state = {
      amount: 0,
      memo: '',
      posted: ensureUTCMoment(props.appstate.defaultPostingDate),
      account_id: props.account ? props.account.id : null,
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.account) {
      this.setState({
        account_id: nextProps.account.id,
      })
    }
    let pd = nextProps.appstate.defaultPostingDate;
    if (pd.month() !== this.state.posted.month()
      || pd.year() !== this.state.posted.year()) {
      this.setState({
        posted: pd,
      })
    }
  }
  doTransaction = () => {
    if (this.state.amount) {
      manager.store.accounts.transact({
        account_id: this.state.account_id,
        amount: this.state.amount,
        memo: this.state.memo,
        posted: this.state.posted,
      })
      this.setState({
        amount: 0,
        memo: '',
      }, () => {
        this.memo_elem.focus();
      })
    }
  }
  render() {
    let { account, hideAccount, appstate } = this.props;
    let account_cell;
    let transact_label = 'Deposit';
    if (this.state.amount < 0) {
      transact_label = 'Withdraw';
    }
    if (!hideAccount) {
      // show accounts
      if (account) {
        account_cell = <td>
          {account.name}
        </td>
      } else {
        let value = this.state.account_id;
        if (value === null) {
          value = undefined;
        }
        account_cell = <td>
          <select value={value} onChange={(ev) => {
            this.setState({account_id: parseInt(ev.target.value) || null})
          }}>
            <option></option>
            {_.values(appstate.accounts).map(acc => {
              return <option key={acc.id} value={acc.id}>{acc.name}</option>
            })}
          </select>
        </td>
      }
    }
    return (
      <tr className="action-row">
        <td>
          <DateInput
            value={this.state.posted}
            onChange={(new_posting_date) => {
              this.setState({posted: new_posting_date});
            }} />
        </td>
        {account_cell}
        <td>
          <input
            type="text"
            value={this.state.memo}
            onChange={(ev) => {
              this.setState({memo: ev.target.value})
            }}
            ref={(elem) => {
              if (elem) {
                this.memo_elem = elem;  
              }
            }}
          />
        </td>
        <td className="right">
          <MoneyInput
            value={this.state.amount}
            onChange={(amount) => {
              this.setState({amount: amount})
            }}
            ref={(elem) => {
              if (elem) {
                this.amount_elem = elem;
              }
            }}
          />
        </td>
        <td className="center">
          <button onClick={this.doTransaction}>{transact_label}</button>
        </td>
      </tr>
      )
  }
}

interface CategorizerProps {
  transaction: Transaction;
  appstate: AppState;
}
class Categorizer extends React.Component<CategorizerProps, {
  categories: Category[];
  clean_cats: Category[];
  open: boolean;
}> {
  constructor(props) {
    super(props)
    this.state = {
      categories: [],
      clean_cats: [],
      open: false,
    }
    this.refreshCategories(this.props)
  }
  componentWillReceiveProps(nextProps) {
    this.refreshCategories(nextProps)
  }
  refreshCategories(props:CategorizerProps) {
    return manager.store.accounts.getCategories(props.transaction.id)
    .then(cats => {
      this.setState({
        categories: cats,
        clean_cats: this.cleanCats(props.transaction, cats),
      })
    })
  }
  openCategorizer = () => {
    this.setState({open: true})
  }
  closeCategorizer = () => {
    this.setState({open: false})
  }
  saveChanges = async () => {
    let { transaction } = this.props;

    await manager.store.accounts.categorize(transaction.id, this.state.clean_cats)
    await this.refreshCategories(this.props);
    this.setState({open: false})
  }
  generalCat = (name) => {
    return async () => {
      let { transaction } = this.props;

      await manager.store.accounts.categorizeGeneral(transaction.id, name);
      await this.refreshCategories(this.props);
      this.setState({open: false})
    }
  }
  cleanCats(trans:Transaction, categories:Category[],
      idx?:number, replacement?:Category|'delete'):Category[] {
    let left = Math.abs(trans.amount);
    let sign = Math.sign(trans.amount);
    let ret = categories.map((cat, i) => {
      if (idx !== undefined && i == idx) {
        if (replacement === 'delete') {
          return null;
        } else {
          cat = replacement;
        }
      }
      let amount = Math.abs(cat.amount);
      if (amount > left) {
        amount = left
      }
      left -= amount;
      return {
        bucket_id: cat.bucket_id,
        amount: amount * sign,
      }
    })
    .filter(x => x !== null);

    if (left > 0) {
      // some left
      if (replacement === 'delete' && ret.length) {
        let target = idx - 1;
        target = target >= 0 ? target : 0;
        ret[target].amount += (left * sign);
      } else {
        ret.push({
          bucket_id: null,
          amount: left * sign,
        })
      }
    }
    return ret;
  }
  renderOpen() {
    let { transaction, appstate } = this.props;
    let bucket_options = _.sortBy(appstate.unkicked_buckets, [bucket=>bucket.name.toLowerCase()])
      .map(bucket => {
        return <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
      })
    let cats = this.state.clean_cats;
    let elems = cats.map((cat, idx) => {
      return <div className="category" key={idx}>
        <select
          value={cat.bucket_id || ''}
          onChange={ev => {
            this.setState({
              clean_cats: this.cleanCats(transaction, cats, idx, {
                bucket_id: parseInt(ev.target.value) || null,
                amount: cat.amount,
              }),
            })
          }}>
          <option></option>
          {bucket_options}
        </select>
        <MoneyInput
          value={Math.abs(cat.amount)}
          onChange={val => {
            this.setState({
              clean_cats: this.cleanCats(transaction, cats, idx, {
                bucket_id: cat.bucket_id,
                amount: Math.abs(val),
              }),
            })
          }}
        />
        <button
          onClick={() => {
            this.setState({
              clean_cats: this.cleanCats(transaction, cats, idx, 'delete'),
            })
          }}>x</button>
      </div>
    })
    return <div className="categorizer open">
      {elems}
      <div>
        <button onClick={this.generalCat('income')}>Income</button>
        <button onClick={this.generalCat('transfer')}>Transfer</button>
      </div>
      <div>
        <button onClick={this.closeCategorizer}>Cancel</button>
        <button onClick={this.saveChanges}>Save</button>
      </div>
    </div>
  }
  renderClosed() {
    let { appstate, transaction } = this.props;
    let cats = this.state.categories;
    let guts;
    if (transaction.general_cat === 'income') {
      // income
      guts = <a className="general-tag" onClick={this.openCategorizer}>
          💰 Income
        </a>
    } else if (transaction.general_cat === 'transfer') {
      // transfer
      guts = <a className="general-tag" onClick={this.openCategorizer}>
          ⇄ Transfer
        </a>
    } else if (cats.length) {
      // categorized
      let bucketName = (cat:Category):string => {
        return (appstate.buckets[cat.bucket_id] || {} as any).name || '???';
      }
      let categories = cats.map((cat, idx) => {
        let className = cx('tag', `custom-bucket-style-${cat.bucket_id}`);
        return <a key={idx} className={className} onClick={this.openCategorizer}>
          <div className="name">
            {bucketName(cat)}
          </div>
          <div className="amount">
            <Money nocolor value={cat.amount} />
          </div>
        </a>
      })
      guts = <div>{categories}</div>
    } else {
      // no category
      guts = <button
        onClick={this.openCategorizer}
        onFocus={this.openCategorizer}>Categorize</button>
    }
    return <div className="categorizer">
      {guts}
    </div>
  }
  render() {
    if (this.state.open) {
      return this.renderOpen()
    } else {
      return this.renderClosed()
    }
  }
}