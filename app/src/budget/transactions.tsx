'use strict';
import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import {manager, AppState} from './appstate'
import {Category, Transaction} from '../models/account'
import {Date, ensureUTCMoment} from '../time'
import {Money, MoneyInput} from '../money'


interface TransactionPageProps {
  appstate: AppState;
}
export class TransactionPage extends React.Component<TransactionPageProps, {}> {
  render() {
    return <div className="page">
      <TransactionList
        appstate={this.props.appstate}
        transactions={_.values(this.props.appstate.transactions)}
      />
    </div>
  }
}

interface TransactionListProps {
  transactions: Transaction[];
  appstate: AppState;
  hideAccount?: boolean;
}
export class TransactionList extends React.Component<TransactionListProps, any> {
  render() {
    console.log('TransactionList render', this.props.transactions)
    let { appstate } = this.props;
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
        <td><Money value={trans.amount} /></td>
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
        {elems}
      </tbody>
    </table>
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
    let bucket_options = _.values(appstate.buckets)
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