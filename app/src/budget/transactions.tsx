'use strict';
import * as React from 'react'
import * as _ from 'lodash'
import * as sortBy from 'lodash.sortby'
import * as cx from 'classnames'
import * as moment from 'moment-timezone'
import { IStore } from 'buckets-core/dist/store'
import { manager, AppState } from './appstate'
import { Bucket } from 'buckets-core/dist/models/bucket'
import { Account, Category, Transaction, GeneralCatType } from 'buckets-core/dist/models/account'
import { DateDisplay, DateInput } from '../time'
import { moment2LocalDay, localDay2moment, parseLocalTime } from 'buckets-core/dist/time'
import { Money, MoneyInput } from '../money'
import { Help } from '../tooltip'
import { onKeys, SafetySwitch } from '../input'
import { sss } from '../i18n'
import { getCurrentFile } from '../mainprocess/files'
import { makeToast } from './toast'
import { isNil } from 'buckets-core/dist/util'
import { findPotentialDupes } from './dupes'
import { NoteMaker } from './notes'
// import { PrefixLogger } from '../logging'

// const log = new PrefixLogger('(transactions)')

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
          categories={appstate.categories}
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
              getCurrentFile().openImportFileDialog();
            }}>
            <span className="fa fa-upload"></span> {sss('Import file')}
          </button>
        </div>
      </div>
      <div className="panes">
        <div className="padded">
          <TransactionList
            appstate={appstate}
            categories={appstate.categories}
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
  categories: {[k:number]:Category[]}
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
    let { appstate, categories, account, noCreate, ending_balance, sortFunc } = this.props;
    let { selected } = this.state;
    let hideAccount = this.props.hideAccount || false;
    sortFunc = sortFunc || [
      (item:Transaction) => -parseLocalTime(item.posted).unix(),
      (item:Transaction) => -item.id,
    ]
    let elems:Element = sortBy(this.props.transactions, sortFunc)
    .map((trans:Transaction) => {
      let balance;
      if (!isNil(ending_balance)) {
        balance = ending_balance;
        ending_balance -= trans.amount;  
      }
      return <TransRow
        key={trans.id}
        trans={trans}
        appstate={appstate}
        categories={categories[trans.id]}
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
                .sub.accounts.deleteTransactions(Array.from(this.state.selected));
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
          <th x-name="category">{sss('Category')}</th>
          <th x-name="edit"></th>
        </tr>
      </thead>
      <tbody>
        {noCreate ? null : <TransRow
          account={account}
          appstate={appstate}
          categories={null}
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
  categories: Category[];
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
  cats: Category[];
  transfer_account_id: number;
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
      general_cat: props.trans ? props.trans.general_cat : '',
      cats: props.categories ? props.categories : [],
      transfer_account_id: null,
    }
    Object.assign(this.state, this.recomputeState(props));
  }
  componentWillReceiveProps(nextProps) {
    this.setState(this.recomputeState(nextProps) as TransRowState);
  }
  startEditing() {
    let newstate = this.recomputeState(this.props);
    newstate.editing = true;
    this.setState(newstate as TransRowState)
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
      if (this.props.trans && this.props.trans.general_cat !== props.trans.general_cat) {
        state.general_cat = props.trans.general_cat;
      }
      if (!_.isEqual(this.props.categories, props.categories)) {
        state.cats = props.categories;
      }
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
  async alsoCategorize(store:IStore, trans:Transaction, cats:Category[]) {
    if (trans) {
      const invalid_cats = cats.filter(x => x.bucket_id===null).length;
      if (this.state.general_cat) {
        await store.sub.accounts.categorizeGeneral(trans.id, this.state.general_cat);
      } else if (cats.length && !invalid_cats) {
        await store.sub.accounts.categorize(trans.id, cats);
      } else if (cats.length > 1 && invalid_cats) {
        makeToast(sss('Invalid categorization.  Categories not set.'), {className: 'warning'})
      } else if (cats.length === 1 && invalid_cats) {
        // Single invalid categorization
        await store.sub.accounts.removeCategorization(trans.id, true);
      }
    }
  }
  doTransaction = async () => {
    if (this.props.trans) {
      // update
      const store = manager
      .checkpoint(sss('Update Transaction'))
      const cats = this.state.cats;
      const trans = await store.sub.accounts.updateTransaction(this.props.trans.id, {
        account_id: this.state.account_id,
        amount: this.state.amount,
        memo: this.state.memo,
        posted: this.state.posted,
      })
      await this.alsoCategorize(store, trans, cats);
      this.setState({
        editing: false,
      })
    } else {
      // create
      if (this.state.amount) {
        try {
          const store = manager
          .checkpoint(sss('Create Transaction'))

          const cats = this.state.cats;
          const trans = await store.sub.accounts.transact({
            account_id: this.state.account_id,
            amount: this.state.amount,
            memo: this.state.memo,
            posted: this.state.posted,
          })
          await this.alsoCategorize(store, trans, cats);
          if (this.state.general_cat === 'transfer' && this.state.transfer_account_id) {
            // Create a second, opposite transaction
            const xfer_trans = await store.sub.accounts.transact({
              account_id: this.state.transfer_account_id,
              amount: -this.state.amount,
              memo: this.state.memo,
              posted: this.state.posted,
            })
            await store.sub.accounts.categorizeGeneral(xfer_trans.id, 'transfer');
          }
          this.setState({
            amount: 0,
            memo: '',
            general_cat: '',
            cats: [],
            transfer_account_id: null,
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
    } else if (trans) {
      source_icon = <button
        title={trans.cleared
          ? sss("Cleared"/* Tooltip text indicating that a transaction has cleared. */)
          : sss("Not yet cleared"/* Tooltip text indicating that a transaction has not yet cleared. */)}
        className={cx("icon hover cleared-indicator", {
          cleared: trans.cleared,
        })}
        onClick={ev => {
          let undo_note = trans.cleared ? sss('Mark Not Cleared'/* Name of action for marking a transaction as not having cleared the bank */) : sss('Mark Cleared'/* Name of action for marking a transaction as having cleared the bank */);
          manager.checkpoint(undo_note)
          .sub.accounts.updateTransaction(trans.id, {cleared: !trans.cleared})
        }}><span className="fa fa-check-circle"/></button>
    }
    if (this.state.editing) {
      // editing
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
      let categoryInput;
      let relatedAccountSelect;
      if (trans) {
        // Editing an existing transaction
        if (appstate.accounts[trans.account_id].offbudget) {
          categoryInput = sss('Off budget');
        } else {
          categoryInput = <CategoryInput
            buckets={appstate.unkicked_buckets}
            amount={this.state.amount}
            cats={this.state.cats.length ? this.state.cats : (appstate.categories[trans.id] || [])}
            general_cat={this.state.general_cat}
            onEnter={() => {
              this.doTransaction()
            }}
            onChange={(general_cat:GeneralCatType, cats:Category[]) => {
              this.setState({
                general_cat,
                cats,
              })
            }}
          />
        }
      } else {
        // Creating a new transaction
        if (!isNil(this.state.account_id) && appstate.accounts[this.state.account_id].offbudget) {
          categoryInput = sss('Off budget');
        } else {
          categoryInput = <CategoryInput
            buckets={appstate.unkicked_buckets}
            amount={this.state.amount}
            cats={this.state.cats}
            general_cat={this.state.general_cat}
            onEnter={() => {
              this.doTransaction()
            }}
            onChange={(general_cat:GeneralCatType, cats:Category[]) => {
              this.setState({
                general_cat,
                cats,
              })
            }}
          />
        }

        if (this.state.general_cat === 'transfer') {
          const dropdown = <select
            value={this.state.transfer_account_id || ''}
            onKeyDown={postOnEnter}
            onChange={ev => {
              let selection = Number(ev.target.value);
              this.setState({
                transfer_account_id: isNaN(selection) ? null : selection,
              })
            }}>
            <option></option>
            {Object.values<Account>(appstate.accounts).map(account => {
              if (account.id === this.state.account_id) {
                // Can't transfer to/from the same account
                return null;
              }
              return <option value={account.id} key={account.id}>{account.name}</option>
            })}
          </select>
          if (this.state.amount >= 0) {
            relatedAccountSelect = <div>
              {sss('transfer-from-account', (dropdown:JSX.Element) => {
                return <span>Transfer from {dropdown}</span>
              })(dropdown)}</div>
          } else {
            relatedAccountSelect = <div>
              {sss('transfer-to-account', (dropdown:JSX.Element) => {
                return <span>Transfer to {dropdown}</span>
              })(dropdown)}</div>
          }
        }
      }
      return (
        <tr className="action-row">
          <td></td>
          <td>
            <DateInput
              value={moment2LocalDay(this.state.posted)}
              onChange={(new_posting_date) => {
                let posted = localDay2moment(new_posting_date)
                this.setState({posted});
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
            <MoneyInput
              value={this.state.amount}
              onKeyDown={postOnEnter}
              onChange={(amount) => {
                this.setState({amount: amount})
              }}
            />
          </td>
          { isNil(running_bal) ? null : <td></td> }
          <td x-name="categorize" className="center">
            {categoryInput}
            {relatedAccountSelect}
          </td>
          <td x-name="edit" className="icon-wrap center">
            <button
              className="icon"
              onClick={this.doTransaction}>
                <span className="fa fa-check" /></button>
          </td>
        </tr>
        )
    } else {
      // viewing
      return <tr className="icon-hover-trigger">
        <td>{checkbox}</td>
        <td className="nobr">
          <NoteMaker obj={trans} />
          {source_icon}
          <span><DateDisplay value={trans.posted} islocal /></span>
        </td>
        {hideAccount ? null : <td>{appstate.accounts[trans.account_id].name}</td>}
        <td>{trans.memo}</td>
        <td className="right"><Money value={trans.amount} /></td>
        {isNil(running_bal) ? null : <td className="right"><Money value={running_bal} /></td> }
        <td x-name="categorize">
          {appstate.accounts[trans.account_id].offbudget
           ? <div>{sss('Off budget')}</div>
           : <Categorizer
              transaction={trans}
              cats={appstate.categories[trans.id]}
              appstate={appstate} />
          }
        </td>
        <td x-name="edit" className="icon-wrap center">
          <button className="icon show-on-row-hover"
            onClick={() => {
              this.startEditing();
            }}><span className="fa fa-pencil" /></button>
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
      amount: cat_amount * sign,
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
  autoFocus?: boolean;
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
    let newstate:Partial<CategoryInputState> = {};
    let willchange = false;
    if (nextProps.amount !== this.props.amount) {
      newstate.cats = changeCats(nextProps.amount, this.state.cats);
      willchange = true;
    }
    if (nextProps.general_cat !== this.state.general_cat) {
      newstate.general_cat = nextProps.general_cat;
      willchange = true;
    }
    if (willchange) {
      this.setState(newstate as any, () => {
        this.emitChange();
      })
    }
  }
  emitChange() {
    if (this.state.general_cat) {
      this.props.onChange(this.state.general_cat, []);
    } else {
      this.props.onChange(this.state.general_cat, this.state.cats);
    }
  }
  render() {
    const { buckets, amount, autoFocus } = this.props;
    const { general_cat, cats } = this.state;
    const bucket_options = sortBy(buckets, [bucket=>bucket.name.toLowerCase()])
      .map((bucket:Bucket) => {
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
        className = cx('tag', !_.isNil(cat.bucket_id) ? `bucket-style-${cat.bucket_id}` : '');
        select_value = _.isNil(cat.bucket_id) ? '' : cat.bucket_id;
      }
      let extra_options;
      if (idx === 0) {
        extra_options = [
          <option key="transfer" value="transfer">{sss('Transfer')}</option>
        ];
        if (amount >= 0) {
          extra_options.push(<option key="income" value="income">{sss('Income')}</option>)
        }
      }
      return <div className="category" key={idx}>
        <div className={className}>
          <div className="name">
            <select
              value={select_value}
              ref={elem => {
                if (autoFocus && elem && idx === 0 && !this.state.did_focus) {
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
                  }, () => {
                    this.emitChange();
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
              <option></option>
              {extra_options}
              {extra_options ? <option></option> : null}
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
          className="subtle"
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
          }}><span className="fa fa-ban" /></a>
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
  appstate: AppState;
  transaction: Transaction;
  cats: Category[];
}
class Categorizer extends React.Component<CategorizerProps, {
  cats: Category[];
  new_general_cat: GeneralCatType;
  open: boolean;
}> {
  constructor(props:CategorizerProps) {
    super(props)
    this.state = {
      cats: props.cats || [],
      new_general_cat: props.transaction.general_cat,
      open: false,
    }
  }
  componentWillReceiveProps(nextProps:CategorizerProps) {
    let toupdate:any = {};
    if (nextProps.transaction.general_cat !== this.props.transaction.general_cat) {
      toupdate.new_general_cat = nextProps.transaction.general_cat
    }
    if (nextProps.cats !== this.props.cats) {
      toupdate.cats = nextProps.cats;
    }
    this.setState(toupdate);
  }
  openCategorizer = () => {
    this.setState({open: true})
  }
  closeCategorizer = () => {
    this.setState({
      open: false,
      cats: this.props.cats || [],
    })
  }
  saveChanges = async () => {
    const invalid_cats = this.state.cats.filter(x => x.bucket_id===null).length;
    if (this.state.new_general_cat) {
      await manager
        .checkpoint(sss('Categorization'))
        .sub.accounts.categorizeGeneral(this.props.transaction.id, this.state.new_general_cat)
    } else {
      if (this.state.cats.length === 1 && invalid_cats) {
        await manager
          .checkpoint(sss('Remove Categorization'))
          .sub.accounts.removeCategorization(this.props.transaction.id, true);
        this.setState({cats: [], new_general_cat: ''});
      } else if (!invalid_cats) {
        await manager
          .checkpoint(sss('Categorization'))
          .sub.accounts.categorize(this.props.transaction.id, this.state.cats)
      }
    }
    this.setState({open: false})
  }
  renderOpen() {
    let { transaction, appstate } = this.props;
    return <div className="categorizer open">
      <CategoryInput
        buckets={appstate.unkicked_buckets}
        amount={transaction.amount}
        cats={this.state.cats}
        general_cat={this.state.new_general_cat}
        autoFocus
        onEnter={() => {
          this.saveChanges();
        }}
        onChange={(general_cat:GeneralCatType, cats:Category[]) => {
          if (general_cat) {
            this.setState({new_general_cat: general_cat});
          } else {
            this.setState({
              new_general_cat: '',
              cats: cats,
            })
          }
        }}
      />
      <div className="categorizer-buttons">
        <button onClick={this.closeCategorizer}>{sss('Cancel')}</button>
        <button onClick={this.saveChanges}>{sss('Save')}</button>
      </div>
    </div>
  }
  renderClosed() {
    let { appstate, transaction } = this.props;
    let cats = this.state.cats;
    let guts;
    if (transaction.general_cat === 'income') {
      // income
      guts = <a className="general-tag" onClick={this.openCategorizer}>
          💰 {sss('noin.income', 'Income')}
        </a>
    } else if (transaction.general_cat === 'transfer') {
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
        let className = cx('category-tag', `bucket-style-${cat.bucket_id}`);
        return <a key={idx} className={className} onClick={this.openCategorizer}>
          <div className="name">
            {bucketName(cat)}
          </div>
          {cats.length === 1 ? null : <div className="amount">
            <Money nocolor value={cat.amount} hideZeroCents noFaintCents />
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