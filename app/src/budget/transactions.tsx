'use strict';
import * as React from 'react'
import * as _ from 'lodash'
import {State} from './budget'
import {Category, Transaction} from '../models/account'
import {Date, ensureUTCMoment} from '../time'
import {Money, MoneyInput} from '../money'


interface TransactionPageProps {
  state: State;
}
export class TransactionPage extends React.Component<TransactionPageProps, {}> {
  render() {
    return <div className="page">
      <TransactionList
        state={this.props.state}
        transactions={this.props.state.transactions}
      />
    </div>
  }
}

interface TransactionListProps {
  transactions: Transaction[];
  state: State;
  hideAccount?: boolean;
}
export class TransactionList extends React.Component<TransactionListProps, any> {
  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props);
  }
  render() {
    console.log('TransactionList rendering');
    let state = this.props.state;
    let hideAccount = this.props.hideAccount || false;
    let elems = _.sortBy(this.props.transactions, [
      item => -ensureUTCMoment(item.posted).unix(),
      'account_id',
      'id',
    ])
    .map(trans => {
      return <tr key={trans.id}>
        <td><Date value={trans.posted} /></td>
        {hideAccount ? null : <td>{state.accounts[trans.account_id].name}</td>}
        <td>{trans.memo}</td>
        <td><Money value={trans.amount} /></td>
        <td><Categorizer
          transaction={trans}
          state={state} /></td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>Posted</th>
          {hideAccount ? null : <th>Account</th>}
          <th>Memo</th>
          <th>Amount</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
        {elems}
      </tbody>
    </table>
  }
}

interface CategorizerProps {
  transaction: Transaction;
  state: State;
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
    this.refreshCategories()
  }
  refreshCategories() {
    return this.props.state.store.accounts.getCategories(this.props.transaction.id)
    .then(cats => {
      console.log('got categories', cats);
      this.setState({
        categories: cats,
        clean_cats: this.cleanCats(this.props.transaction, cats),
      })
    })
  }
  openCategorizer = () => {
    this.setState({open: true})
  }
  closeCategorizer = () => {
    this.setState({open: false})
  }
  saveChanges = () => {
    this.setState({open: false})
  }
  generalCat = (name) => {
    return () => {
      console.log('setting to', name);
      this.setState({open: false})
    }
  }
  cleanCats(trans:Transaction, categories:Category[],
      idx?:number, replacement?:Category|'delete'):Category[] {
    let left = Math.abs(trans.amount);
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
        amount: amount,
      }
    })
    .filter(x => x !== null);

    if (left > 0) {
      // some left
      if (replacement === 'delete' && ret.length) {
        let target = idx - 1;
        target = target >= 0 ? target : 0;
        ret[target].amount += left;
      } else {
        ret.push({
          bucket_id: null,
          amount: left,
        })
      }
    }
    return ret;
  }
  renderOpen() {
    let {transaction, state} = this.props;
    let bucket_options = _.values(state.buckets)
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
          {bucket_options}
        </select>
        <MoneyInput
          value={cat.amount}
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
    let {transaction} = this.props;
    let cats = this.state.categories;
    let guts;
    if (transaction.general_cat === 'income') {
      // income
    } else if (transaction.general_cat === 'transfer') {
      // transfer
    } else if (cats.length) {
      // categorized
      guts = <div>Categorized</div>
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