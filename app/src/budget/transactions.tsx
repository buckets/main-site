'use strict';
import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import * as moment from 'moment-timezone'
import { manager, AppState } from './appstate'
import { Bucket } from '../models/bucket'
import { Account, Category, Transaction, GeneralCatType } from '../models/account'
import { DateDisplay, DateInput, parseLocalTime } from '../time'
import { Money, MoneyInput } from '../money'
import { Help } from '../tooltip'
import { onKeys, SafetySwitch } from '../input'
import { sss } from '../i18n'
import { current_file } from '../mainprocess/files'
import { makeToast } from './toast'
import { isNil } from '../util'
import { findPotentialDupes } from './dupes'
import { NoteMaker } from './notes'

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

    let dupes = findPotentialDupes(transactions);
    let dupe_list;
    if (dupes.length) {
      dupe_list = <div>
        <h2>{sss('Possible Duplicates')}</h2>
        <TransactionList
          noCreate
          appstate={appstate}
          transactions={dupes}
          sortFunc={[
            'amount',
            (item:Transaction) => -parseLocalTime(item.posted).unix(),
            'account_id',
            (item:Transaction) => -item.id,
          ]}
        />
      </div>
    }
    return (
    <div className="rows">
      <div className="subheader">
        <div className="group">
          <div className="control">
            <label><input
              type="checkbox"
              checked={this.state.show_subset} 
              onChange={this.showUncategorized} /> {sss('Show uncategorized')}</label>
          </div>
        </div>
        <div className="group">
          <button
            onClick={ev => {
              current_file.openImportFileDialog();

            }}>
            <span className="fa fa-upload"></span> {sss('Import file')}
          </button>
        </div>
      </div>
      <div className="panes">
        <div className="padded">
          <TransactionList
            appstate={appstate}
            transactions={transactions}
          />
          {dupe_list}
        </div>
      </div>
    </div>);
  }
}

interface TransactionListProps {
  transactions: Transaction[];
  appstate: AppState;
  noCreate?: boolean;
  hideAccount?: boolean;
  account?: Account;
  ending_balance?: number;
  sortFunc?: Array<Function|string>;
}
interface TransactionListState {
  selected: Set<number>;
}
export class TransactionList extends React.Component<TransactionListProps, TransactionListState> {
  constructor(props) {
    super(props);
    this.state = {
      selected: new Set<number>(),
    }
  }
  render() {
    let { appstate, account, noCreate, ending_balance, sortFunc } = this.props;
    let { selected } = this.state;
    let hideAccount = this.props.hideAccount || false;
    sortFunc = sortFunc || [
      (item:Transaction) => -parseLocalTime(item.posted).unix(),
      'account_id',
      (item:Transaction) => -item.id,
    ]
    let elems = _.sortBy(this.props.transactions, sortFunc)
    .map(trans => {
      let balance;
      if (!isNil(ending_balance)) {
        balance = ending_balance;
        ending_balance -= trans.amount;  
      }
      return <TransRow
        key={trans.id}
        trans={trans}
        appstate={appstate}
        selected={selected && selected.has(trans.id)}
        running_bal={balance}
        onSelectChange={checked => {
          let newset = new Set(selected)
          if (checked) {
            newset.add(trans.id);
          } else {
            newset.delete(trans.id);
          }
          this.setState({
            selected: newset,
          })
        }}
        hideAccount={hideAccount}
      />
    })

    let delete_count;
    if (this.state.selected.size) {
      delete_count = this.state.selected.size;
    }

    return <table className="ledger transaction-list">
      <thead className="actions">
        <tr>
          <td colSpan={100}>
            <SafetySwitch
              disabled={!this.state.selected.size}
              onClick={ev => {
                manager
                .checkpoint(sss('Delete Transactions'))
                .accounts.deleteTransactions(Array.from(this.state.selected));
                this.setState({selected: new Set<number>()})
              }}
            >
              <span><span className="fa fa-trash" /> {delete_count}</span>
            </SafetySwitch>
          </td>
        </tr>
      </thead>
      <thead>
        <tr>
          <th></th>
          <th className="nobr">{sss('Posted')}</th>
          {hideAccount ? null : <th>{sss('Account')}</th>}
          <th>{sss('Memo')}</th>
          <th>{sss('Amount')}</th>
          {isNil(ending_balance) ? null : <th>{sss('Balance')}</th>}
          <th></th>
          <th>{sss('Category')}</th>
        </tr>
      </thead>
      <tbody>
        {noCreate ? null : <TransRow
          account={account}
          appstate={appstate}
          hideAccount={hideAccount}
          running_bal={isNil(ending_balance) ? null : 1}
          noCheckbox
        />}
        {elems}
      </tbody>
    </table>
  }
}


interface TransRowProps {
  appstate: AppState;
  trans?: Transaction;
  account?: Account;
  running_bal?: number;
  hideAccount?: boolean;
  noCheckbox?: boolean;
  selected?: boolean;
  onSelectChange?: (selected:boolean)=>any;
}
interface TransRowState {
  editing: boolean;
  amount: number;
  memo: string;
  posted: moment.Moment;
  account_id: number;
  general_cat: GeneralCatType;
}
class TransRow extends React.Component<TransRowProps, TransRowState> {
  private memo_elem = null;
  constructor(props:TransRowProps) {
    super(props);
    this.state = {
      editing: false,
      amount: null,
      memo: '',
      posted: props.appstate.defaultPostingDate,
      account_id: null,
      general_cat: '',
    }
    Object.assign(this.state, this.recomputeState(props));
  }
  componentWillReceiveProps(nextProps) {
    this.setState(this.recomputeState(nextProps) as TransRowState);
  }
  recomputeState(props:TransRowProps):Partial<TransRowState> {
    if (props.trans) {
      // An existing transaction is being shown
      let state:Partial<TransRowState> = {
        editing: this.state.editing,
        amount: props.trans.amount,
        memo: props.trans.memo,
        posted: parseLocalTime(props.trans.posted),
        account_id: props.trans.account_id,
      };
      if (props.account) {
        state.account_id = props.account.id;
      }
      return state;
    } else {
      // No transaction, so we're in edit mode by virtue of creating a transaction
      let ret:Partial<TransRowState> = {
        editing: true,
      }
      if (props.account) {
        ret.account_id = props.account.id;
      }
      let vr = props.appstate.viewDateRange
      if (this.state.posted.isBefore(vr.onOrAfter)) {
        ret.posted = props.appstate.defaultPostingDate;
      } else if (this.state.posted.isSameOrAfter(vr.before)) {
        ret.posted = props.appstate.defaultPostingDate;
      }
      return ret;
    }
  }
  doTransaction = async () => {
    if (this.props.trans) {
      // update
      await manager
      .checkpoint(sss('Update Transaction'))
      .accounts.updateTransaction(this.props.trans.id, {
        account_id: this.state.account_id,
        amount: this.state.amount,
        memo: this.state.memo,
        posted: this.state.posted,
      })
      this.setState({
        editing: false,
      })
    } else {
      // create
      if (this.state.amount) {
        try {
          await manager
          .checkpoint(sss('Create Transaction'))
          .accounts.transact({
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
        } catch(err) {
          makeToast(err.toString(), {className: 'error'})
        }
      }
    }
  }
  render() {
    let { trans, account, noCheckbox, selected, hideAccount, running_bal, onSelectChange, appstate } = this.props;
    let checkbox;
    if (!noCheckbox) {
      checkbox = <input
          type="checkbox"
          checked={selected}
          onChange={ev => {
            onSelectChange(ev.target.checked);
          }} />
    }
    let source_icon;
    if (trans && trans.fi_id) {
      source_icon = <Help icon={<span className="fa fa-flash from-fi fa-fw" />}>{sss('sync-symbol help', "This symbol means the transaction came from an import/sync")}</Help>
    }
    if (this.state.editing) {
      // editing
      let deposit_withdrawl;
      if (this.state.amount > 0) {
        deposit_withdrawl = sss('Deposit');
      } else if (this.state.amount < 0) {
        deposit_withdrawl = sss('Withdraw');
      }
      let account_cell;
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
              {Object.values<Account>(appstate.accounts).map(acc => {
                return <option key={acc.id} value={acc.id}>{acc.name}</option>
              })}
            </select>
          </td>
        }
      }
      let postOnEnter = (ev) => {
        if (ev.key === 'Enter') {
          this.doTransaction();
        }
      }
      return (
        <tr className="action-row">
          <td></td>
          <td>
            <DateInput
              value={this.state.posted}
              islocal
              onChange={(new_posting_date) => {
                this.setState({posted: new_posting_date});
              }} />
          </td>
          {account_cell}
          <td>
            <input
              type="text"
              style={{width: "100%"}}
              value={this.state.memo}
              onChange={(ev) => {
                this.setState({memo: ev.target.value})
              }}
              onKeyDown={postOnEnter}
              ref={(elem) => {
                if (elem) {
                  this.memo_elem = elem;  
                }
              }}
            />
          </td>
          <td className="right">
            {deposit_withdrawl}
            <MoneyInput
              value={this.state.amount}
              onKeyDown={postOnEnter}
              onChange={(amount) => {
                this.setState({amount: amount})
              }}
            />
          </td>
          { isNil(running_bal) ? null : <td></td> }
          <td className="icon-wrap center">
            <button
              className="icon"
              onClick={this.doTransaction}>
                <span className="fa fa-check" /></button>
          </td>
          <td name="categorization" className="center">
            <CategoryInput
              buckets={appstate.unkicked_buckets}
              amount={this.state.amount}
              cats={[]}
              general_cat={''}
              onChange={(general_cat:GeneralCatType, cats:Category[]) => {
                console.log('cats', general_cat, cats)
              }}
            />
          </td>
        </tr>
        )
    } else {
      // viewing
      return <tr className="note-hover-trigger">
        <td>{checkbox}</td>
        <td className="nobr"><NoteMaker obj={trans} />{source_icon}<DateDisplay value={trans.posted} islocal /></td>
        {hideAccount ? null : <td>{appstate.accounts[trans.account_id].name}</td>}
        <td>{trans.memo}</td>
        <td className="right"><Money value={trans.amount} /></td>
        {isNil(running_bal) ? null : <td className="right"><Money value={running_bal} /></td> }
        <td className="icon-button-wrap">
          <button className="icon show-on-row-hover"
            onClick={() => {
              this.setState({editing: true});
            }}><span className="fa fa-pencil" /></button>
        </td>
        <td>
          <Categorizer
            transaction_id={trans.id}
            amount={trans.amount}
            general_cat={trans.general_cat}
            onCategorize={async (cats:Category[]) => {
              await manager
              .checkpoint(sss('Categorization'))
              .accounts.categorize(trans.id, cats)
            }}
            onGeneralCategorize={async (cat:GeneralCatType) => {
              await manager
              .checkpoint(sss('Categorization'))
              .accounts.categorizeGeneral(trans.id, cat);
            }}
            appstate={appstate} />
        </td>
      </tr>  
    }
  }
}


/**
 *  Apply a change to a list of Categories.
 */
export function changeCats(total_amount:number, src:Category[], change?:{
  action: 'update';
  idx: number;
  value: Category;
}|{
  action: 'delete';
  idx: number;
}):Category[] {
  const sign = Math.sign(total_amount);
  let left = Math.abs(total_amount);
  let cats = src.map(cat => Object.assign({}, cat));

  // Perform the change
  if (!change) {
    // no change, just sum things up
  } else if (change.action === 'delete') {
    cats.splice(change.idx, 1);
  } else if (change.action === 'update') {
    cats[change.idx] = change.value;
  }

  // Adjust amounts
  cats = cats.map((cat, idx) => {
    let cat_amount = Math.abs(cat.amount);
    if (cat_amount > left) {
      // The amount has been used up
      cat_amount = left;
    }
    left -= cat_amount;
    if (left && idx === cats.length-1) {
      // There's some amount left and this is the last category
      if (!change || change.action === 'delete') {
        // Put all that's left into this bucket
        cat_amount += left;
        left = 0;
      } else {
        // update
        if (idx !== change.idx) {
          // This is the last category and something earlier was changed
          // Put all that's left into this bucket
          cat_amount += left;
          left = 0;
        }
      }
    }
    if (!cat_amount) {
      if (change && change.idx === idx) {
        // leave this one alone
      } else {
        return null;
      }
    }
    return {
      bucket_id: cat.bucket_id,
      amount: cat_amount,
    }
  })
  .filter(x => x!==null);

  if (left || !cats.length) {
    cats.push({
      bucket_id: null,
      amount: left * sign,
    })
  }
  return cats;
}

interface CategoryInputProps {
  buckets: Bucket[];
  amount: number;
  cats: Category[];
  general_cat: GeneralCatType;
  onChange: (general_cat:GeneralCatType, cats:Category[])=>void;
  onEnter?: ()=>void;
}
interface CategoryInputState {
  cats: Category[];
  general_cat: GeneralCatType;
  did_focus: boolean;
}
class CategoryInput extends React.Component<CategoryInputProps, CategoryInputState> {
  constructor(props:CategoryInputProps) {
    super(props)
    this.state = {
      cats: this.catsStateFromProps(props),
      general_cat: props.general_cat,
      did_focus: false,
    }
  }
  catsStateFromProps(props:CategoryInputProps):Category[] {
    return changeCats(props.amount, props.cats);
  }
  componentWillReceiveProps(nextProps:CategoryInputProps) {
    this.setState({
      cats: changeCats(nextProps.amount, this.state.cats),
      general_cat: nextProps.general_cat,
    })
  }
  emitChange() {
    if (this.state.general_cat) {
      this.props.onChange(this.state.general_cat, []);
    } else {
      this.props.onChange(this.state.general_cat, this.state.cats);
    }
  }
  render() {
    const { buckets, amount } = this.props;
    const { general_cat, cats } = this.state;
    const bucket_options = _.sortBy(buckets, [bucket=>bucket.name.toLowerCase()])
      .map(bucket => {
        return <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
      })

    let elems;
    elems = cats.map((cat, idx) => {
      let className;
      let select_value;
      if (general_cat) {
        className = cx('tag', 'general-tag');
        select_value = general_cat;
      } else {
        className = cx('tag', !_.isNil(cat.bucket_id) ? `custom-bucket-style-${cat.bucket_id}` : '');
        select_value = _.isNil(cat.bucket_id) ? '' : cat.bucket_id;
      }
      let extra_options;
      if (idx === 0) {
        extra_options = [
          <option key="transfer" value="transfer">⇄ {sss('Transfer')}</option>
        ];
        if (amount >= 0) {
          extra_options.push(<option key="income" value="income">💰 {sss('Income')}</option>)
        }
      }
      return <div className="category" key={idx}>
        <div className={className}>
          <div className="name">
            <select
              value={select_value}
              ref={elem => {
                if (elem && idx === 0 && !this.state.did_focus) {
                  setTimeout(() => {
                    elem.focus();
                  }, 0);
                  this.setState({did_focus: true});
                }
              }}
              onKeyPress={onKeys({
                Enter: () => {
                  this.props.onEnter && this.props.onEnter();
                },
              })}
              onChange={ev => {
                if (ev.target.value === 'income' || ev.target.value === 'transfer') {
                  // general_cat
                  this.setState({
                    general_cat: ev.target.value,
                  })
                } else {
                  // buckets
                  const bucket_id = ev.target.value ? parseInt(ev.target.value) : null;
                  const new_cats = changeCats(this.props.amount, this.state.cats, {
                    action: 'update',
                    idx: idx,
                    value: {
                      bucket_id: bucket_id,
                      amount: this.state.cats[idx].amount,
                    }
                  })
                  this.setState({
                    general_cat: '',
                    cats: new_cats,
                  }, () => {
                    this.emitChange();
                  })
                }
              }}>
              {extra_options}
              <option></option>
              {bucket_options}
            </select>
          </div>
          {general_cat ? null : <MoneyInput
            value={Math.abs(cat.amount)}
            className="amount ctx-matching-input"
            onChange={val => {
              const new_cats = changeCats(this.props.amount, this.state.cats, {
                action: 'update',
                idx: idx,
                value: {
                  bucket_id: this.state.cats[idx].bucket_id,
                  amount: val,
                }
              })
              this.setState({
                cats: new_cats
              }, () => {
                this.emitChange();
              })
            }}
            onKeyPress={onKeys({
              Enter: () => {
                this.props.onEnter && this.props.onEnter();
              },
            })}
          />}
        </div>
        <a
          className="subtle delete-button"
          onClick={() => {
            if (general_cat) {
              this.setState({
                general_cat: '',
              }, () => {
                this.emitChange();
              })
            } else {
              const new_cats = changeCats(this.props.amount, this.state.cats, {
                action: 'delete',
                idx: idx,
              })
              this.setState({
                cats: new_cats,
              }, () => {
                this.emitChange();
              })
            }
          }}>&times;</a>
      </div>
    })

    if (general_cat) {
      elems = elems.slice(0, 1);
    }
    
    return <div className="category-input">
      {elems}
    </div>
  }
}

interface CategorizerProps {
  transaction_id?: number;
  amount: number;
  general_cat: GeneralCatType;
  appstate: AppState;
  onCategorize: (cats:Category[])=>void;
  onGeneralCategorize: (cat:GeneralCatType)=>void;
}
class Categorizer extends React.Component<CategorizerProps, {
  categories: Category[];
  clean_cats: Category[];
  open: boolean;
  did_focus: boolean;
}> {
  constructor(props) {
    super(props)
    this.state = {
      categories: [],
      clean_cats: [],
      open: false,
      did_focus: false,
    }
    this.refreshCategories(this.props)
  }
  componentWillReceiveProps(nextProps) {
    this.refreshCategories(nextProps)
  }
  refreshCategories(props:CategorizerProps) {
    if (props.transaction_id) {
      return manager
      .nocheckpoint
      .accounts.getCategories(props.transaction_id)
      .then(cats => {
        this.setState({
          categories: cats,
          clean_cats: this.cleanCats(props.amount, cats),
        })
      })  
    } else {
      this.setState({
        clean_cats: this.cleanCats(props.amount, this.state.categories),
      })
    }
  }
  openCategorizer = () => {
    this.setState({open: true, did_focus: false})
  }
  closeCategorizer = () => {
    this.setState({open: false})
  }
  saveChanges = async () => {
    await this.props.onCategorize(this.state.clean_cats);
    await this.refreshCategories(this.props);
    this.setState({open: false})
  }
  generalCat = (name) => {
    return async () => {
      await this.props.onGeneralCategorize(name);
      await this.refreshCategories(this.props);
      this.setState({open: false})
    }
  }
  // Clean categories
  // trans_amount: Amount
  // categories: A list of Categorys
  // idx: The anchor index
  // replacement: Either the category that will replace
  //   the deleted
  cleanCats(trans_amount:number, categories:Category[],
      idx?:number, replacement?:Category|'delete'):Category[] {
    let left = Math.abs(trans_amount);
    let sign = Math.sign(trans_amount);
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
      if (left && i === (categories.length-1) && i !== idx) {
        amount += left;
        left = 0;
      }
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
    let { amount, appstate } = this.props;
    let bucket_options = _.sortBy(appstate.unkicked_buckets, [bucket=>bucket.name.toLowerCase()])
      .map(bucket => {
        return <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
      })
    let cats = this.state.clean_cats;
    let elems = cats.map((cat, idx) => {
      let className = cx('tag', 'open', !_.isNil(cat.bucket_id) ? `custom-bucket-style-${cat.bucket_id}` : '');
      return <div className="category" key={idx}>
        <div className={className}>
          <div className="name">
            <select
              value={_.isNil(cat.bucket_id) ? '' : cat.bucket_id}
              ref={elem => {
                if (elem && idx === 0 && !this.state.did_focus) {
                  setTimeout(() => {
                    elem.focus();
                  }, 0);
                  this.setState({did_focus: true});
                }
              }}
              onKeyPress={onKeys({
                Enter: () => {
                  this.saveChanges();
                },
              })}
              onChange={ev => {
                let bucket_id = ev.target.value ? parseInt(ev.target.value) : null;
                this.setState({
                  clean_cats: this.cleanCats(amount, cats, idx, {
                    bucket_id: bucket_id,
                    amount: cat.amount,
                  }),
                })
              }}>
              <option></option>
              {bucket_options}
            </select>
          </div>
          <MoneyInput
            value={Math.abs(cat.amount)}
            className="amount ctx-matching-input"
            onChange={val => {
              this.setState({
                clean_cats: this.cleanCats(amount, cats, idx, {
                  bucket_id: cat.bucket_id,
                  amount: Math.abs(val),
                }),
              })
            }}
            onKeyPress={onKeys({
              Enter: () => {
                this.saveChanges();
              },
            })}
          />
        </div>
        <a
          className="subtle delete-button"
          onClick={() => {
            this.setState({
              clean_cats: this.cleanCats(amount, cats, idx, 'delete'),
            })
          }}>&times;</a>
      </div>
    })
    return <div className="categorizer open">
      {elems}
      <div className="bucket-buttons">
        <button onClick={this.closeCategorizer}>{sss('Cancel')}</button>
        <button onClick={this.saveChanges}>{sss('Save')}</button>
      </div>
      <div className="general-cat-buttons">
        {amount >= 0 ? <button onClick={this.generalCat('income')}>💰 {sss('noun.income', 'Income')}</button> : null}
        <button onClick={this.generalCat('transfer')}>⇄ {sss('noun.transfer', 'Transfer')}</button>
      </div>
    </div>
  }
  renderClosed() {
    let { appstate, general_cat } = this.props;
    let cats = this.state.categories;
    let guts;
    if (general_cat === 'income') {
      // income
      guts = <a className="general-tag" onClick={this.openCategorizer}>
          💰 {sss('noin.income', 'Income')}
        </a>
    } else if (general_cat === 'transfer') {
      // transfer
      guts = <a className="general-tag" onClick={this.openCategorizer}>
          ⇄ {sss('noun.transfer', 'Transfer')}
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
          {cats.length === 1 ? null : <div className="amount">
            <Money nocolor value={cat.amount} hideZeroCents />
          </div>}
        </a>
      })
      guts = <div>{categories}</div>
    } else {
      // no category
      guts = <button
        onClick={this.openCategorizer}
        onFocus={this.openCategorizer}>{sss('Categorize')}</button>
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