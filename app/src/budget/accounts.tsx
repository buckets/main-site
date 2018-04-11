import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import { sss } from '../i18n'
import { shell } from 'electron'
import {Balances} from '../models/balances'
import { Account, Transaction, expectedBalance } from '../models/account'
import { Route, Link, WithRouting, Redirect } from './routing'
import { Money, MoneyInput } from '../money'
import { makeToast } from './toast'
import {TransactionList} from './transactions'
import { ClickToEdit, DebouncedInput, SafetySwitch } from '../input';
import { manager, AppState } from './appstate';
import { setPath } from './budget';
import { Help } from '../tooltip'
import { DateDisplay } from '../time'
import { NoteMaker } from './notes'

function getImportBalance(account:Account, balance:number):number {
  return expectedBalance(account) - (account.balance - balance);
}

export class ClosedAccountsPage extends React.Component<{appstate:AppState}, {}> {
  render() {
    let { appstate } = this.props;
    let rows = appstate.closed_accounts
      .map(account => {
        return <tr key={account.id}>
          <td>{account.name}</td>
          <td><button onClick={() => {
            manager
            .checkpoint(sss('Reopen Account'))
            .accounts.unclose(account.id)
          }}>{sss('Reopen')}</button></td>
          <td>
            <Link relative to={`../${account.id}`} className="subtle"><span className="fa fa-ellipsis-h"/></Link>
          </td>
        </tr>
      })
    let body;
    if (rows.length === 0) {
      body = <div>{sss("You have no closed accounts.")}</div>
    } else {
      body = (
      <div>
        <table className="ledger">
          <thead>
            <tr>
              <th>{sss('Account')}</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>);
    }
    return <div className="panes">
      <div className="padded">
        {body}
      </div>
    </div>
  }
}

interface AccountListProps {
  accounts: Account[];
  balances: Balances;
}
export class AccountList extends React.Component<AccountListProps,any> {
  render() {
    let balances = this.props.balances;
    let accounts = this.props.accounts
    .map((account:Account) => {
      let import_balance = getImportBalance(account, balances[account.id]);
      let import_balance_note;
      if (import_balance !== balances[account.id]) {
        import_balance_note = <Help icon={<div className="alert info">
          <span className="fa fa-exclamation-circle" />
        </div>}>{sss('accounts.balance_mismatch_msg', 'The most recent synced balance does not match the balance computed from transactions.  Click ... for more information.')}</Help>

      }
      return (<tr key={account.id} className="note-hover-trigger">
          <td className="icon-button-wrap"><NoteMaker obj={account} /></td>
          <td className="nobr"><ClickToEdit
            value={account.name}
            placeholder={sss('accounts.name_placeholder', 'no name')}
            onChange={(val) => {
              manager
              .checkpoint(sss('Update Account Name'))
              .accounts.update(account.id, {name: val});  
            }}
          /></td>
          <td className="right nobr"><Money value={balances[account.id]} />{import_balance_note}</td>
          <td><Link relative to={`/${account.id}`} className="subtle"><span className="fa fa-ellipsis-h"/></Link></td>
        </tr>);
    })
    return (<table className="ledger full-width">
      <thead>
        <tr>
          <th></th>
          <th>{sss('Account')}</th>
          <th>{sss('Balance')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {accounts}
      </tbody>
    </table>)
  }
}

interface AccountViewProps {
  account: Account;
  transactions: Transaction[];
  current_balance: number;
  appstate: AppState;
}
export class AccountView extends React.Component<AccountViewProps, {
  new_balance: number;
  balance_edit_showing: boolean;
  new_balance_with_transaction: boolean;
}> {
  constructor(props:AccountViewProps) {
    super(props);
    this.state = {
      new_balance: props.current_balance || 0,
      balance_edit_showing: false,
      new_balance_with_transaction: true,
    }
  }
  componentWillReceiveProps(nextProps:AccountViewProps) {
    if (nextProps.current_balance !== this.props.current_balance) {
      this.setState({
        new_balance: nextProps.current_balance,
        new_balance_with_transaction: true,
      })
    }
  }
  render() {
    let { account, current_balance, appstate } = this.props;
    let import_balance = getImportBalance(account, current_balance);
    let import_balance_field;
    let close_button;
    let closed_ribbon;
    let delete_all_transactions_button;
    if (account.closed) {
      close_button = <button onClick={() => {
        manager
        .checkpoint(sss('Reopen Account'))
        .accounts.unclose(account.id);  
      }}>{sss('Reopen')}</button>
      closed_ribbon = <div className="kicked-ribbon">{sss('single-account Closed', 'Closed')}</div>
      delete_all_transactions_button = <SafetySwitch
        onClick={ev => {
          manager
          .checkpoint(sss('Delete Account'))
          .accounts.deleteWholeAccount(account.id)
          .then(() => {
            makeToast(sss('Account and transactions deleted'));
          });
        }}>
        {sss('Permanently delete account')}
        </SafetySwitch>
    } else {
      close_button = <SafetySwitch
        onClick={ev => {
          manager
          .checkpoint(sss('Close Account'))
          .accounts.close(account.id)
          .then(new_account => {
            if (!new_account.closed) {
              // it was deleted
              makeToast(sss('Account deleted completely'));
            } else {
              makeToast(sss('Account closed'));  
            }
          });
        }}>{sss('Close account')}</SafetySwitch>
    }

    if (import_balance !== current_balance) {
      import_balance_field = <tr>
        <th>{sss('Synced balance')}</th>
        <td>
          <Money value={import_balance} />
          <p>
            <div className="alert info">
              <span className="fa fa-exclamation-circle" />
            </div>
            {sss('accounts.balance_mismatch_long_msg', () => {
              return (<span>
                The "Balance" above is this account's balance as of the latest entered transaction.
                The "Synced balance" is the this account's balance <i>as reported by the bank.</i>
                Some banks always report <i>today's balance</i> as the "Synced balance" even though <i>today's transactions</i> haven't been sent to Buckets yet.
                So this mismatch will usually resolve itself once all the transactions in your bank have been synced into Buckets.
            </span>)})()}
          </p>
        </td>
      </tr>
    }

    let balance_edit_form;
    let bal_time_diff = account.balance - current_balance;
    let new_future_balance = this.state.new_balance + bal_time_diff;
    let bal_adjustment_amount = new_future_balance - account.balance;
    if (this.state.balance_edit_showing) {
      balance_edit_form = <form
        onSubmit={async ev => {
          ev.preventDefault();
          if (bal_adjustment_amount === 0) {
            return;
          }
          let store = manager.checkpoint(sss('Update Account Balance'));
          if (this.state.new_balance_with_transaction) {
            // Update via transaction
            await store.accounts.transact({
              account_id: account.id,
              memo: sss('Update account balance'),
              amount: bal_adjustment_amount,
              posted: appstate.defaultPostingDate,
            })
          } else {
            // Direct update of balance
            await store.accounts.update(account.id, {
              balance: new_future_balance,
            })
          }
          this.setState({
            new_balance_with_transaction: true,
          })
        }}>
        <div>
          <MoneyInput
            autoFocus
            value={this.state.new_balance}
            onChange={newval => {
              this.setState({new_balance: newval});
            }} />
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="record-as"
              value="record-trans"
              checked={this.state.new_balance_with_transaction}
              onChange={ev => {
                this.setState({new_balance_with_transaction: ev.target.checked})
              }}/>
            {sss('Record change as transaction')} (<Money value={bal_adjustment_amount} noFaintCents />)</label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="record-as"
              value="no-trans"
              checked={!this.state.new_balance_with_transaction}
              onChange={ev => {
                this.setState({new_balance_with_transaction: !ev.target.checked})
              }}/> {sss('Update balance without a transaction')}</label>
        </div>
        <div>
          <button>{sss('Update balance')}</button>
        </div>
      </form>
    }
    return (<div className="padded flex-grow-2" key={account.id}>
      {closed_ribbon}
      <h1>
        <ClickToEdit
          value={account.name}
          placeholder={sss('accounts.name_placeholder', 'no name')}
          onChange={(val) => {
            manager
            .checkpoint(sss('Update Account Name'))
            .accounts.update(account.id, {name: val});  
          }}
        />
      </h1>
      <table className="fieldlist">
        <tbody>
          <tr>
            <th>
              {sss('Balance')}
            </th>
            <td>
              <div>
                {sss('money-balance-as-of', (amount:JSX.Element, date:JSX.Element) => {
                  return <span>{amount} as of {date}</span>
                })(
                  <Money value={current_balance} noFaintCents />,
                  <DateDisplay value={appstate.defaultPostingDate} />
                )}
                <button className="icon inline" onClick={ev => {
                  this.setState({balance_edit_showing: !this.state.balance_edit_showing})
                }}><span className={cx("fa", {
                  "fa-pencil": !this.state.balance_edit_showing,
                  "fa-check": this.state.balance_edit_showing,
                })} /></button>
              </div>
              {balance_edit_form}
            </td>
          </tr>

          {import_balance_field}

          <tr>
            <th>{sss('Off budget')}</th>
            <td>
              <input
                type="checkbox"
                checked={account.offbudget}
                onChange={ev => {
                  if (ev.target.checked) {
                    manager
                    .checkpoint(sss('Make Account Off Budget'))
                    .accounts.update(account.id, {offbudget:true});
                  } else {
                    manager
                    .checkpoint(sss('Make Account On Budget'))
                    .accounts.update(account.id, {offbudget:false});
                  }
                }}
              /> 
            </td>
          </tr>

          <tr>
            <th>{sss('Actions')}</th>
            <td>
              {close_button}
              {delete_all_transactions_button}
            </td>
          </tr>
        </tbody>
      </table>
      <hr/>
      <TransactionList
        transactions={this.props.transactions}
        categories={this.props.appstate.categories}
        appstate={this.props.appstate}
        account={account}
        ending_balance={current_balance}
        hideAccount
      />
    </div>)
  }
}

interface AccountsPageProps {
  appstate: AppState,
}
export class AccountsPage extends React.Component<AccountsPageProps, any> {
  render() {
    let { appstate } = this.props;
    let getting_started;
    if (!(appstate.open_accounts.length + appstate.offbudget_accounts.length)) {
      getting_started = <div className="notice">
        {sss('getting-started-link', (clickhandler) => {
          return <span>First time using Buckets?  Check out the <a href="#" onClick={clickhandler}>Getting Started Videos.</a></span>
        })(() => {
          shell.openExternal('https://www.budgetwithbuckets.com/gettingstarted');
        })}
      </div>
    }
    return (
      <div className="rows">
        <div className="subheader">
          <div>
            <button onClick={this.addAccount}>{sss('New account')}</button>
            <button onClick={this.createConnection}>{sss('Connect to bank')}</button>
          </div>
        </div>
        {getting_started}
        <div className="layout-two-col">
          <div className="padded first">
            <AccountList
              accounts={appstate.open_accounts}
              balances={appstate.account_balances} />
            {!appstate.offbudget_accounts.length ? null :
              <div>
                <h2 className="nobr">{sss('Off Budget Accounts')}</h2>
                <AccountList
                  accounts={appstate.offbudget_accounts}
                  balances={appstate.account_balances} />
              </div>}
          </div>
          <div className="second">
            <Route path="/<int:id>">
              <WithRouting func={(routing) => {
                let account = appstate.accounts[routing.params.id];
                if (!account) {
                  return <Redirect to='/accounts' />;
                }
                let balance = appstate.account_balances[account.id];
                return (<AccountView
                  account={account}
                  current_balance={balance}
                  transactions={_.values(appstate.transactions)
                    .filter(t => t.account_id == account.id)}
                  appstate={appstate} />);
              }} />
            </Route>
          </div>
        </div>
      </div>);
  }
  addAccount = () => {
    manager
    .checkpoint(sss('Create Account'))
    .accounts.add(sss('default account name', 'Savings'));  
  }
  createConnection = () => {
    setPath('/import')
  }
}
