import * as React from 'react'
import * as _ from 'lodash'
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
            manager.store.accounts.unclose(account.id);
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
          <td><ClickToEdit
            value={account.name}
            placeholder={sss('accounts.name_placeholder', 'no name')}
            onChange={(val) => {
              manager.store.accounts.update(account.id, {name: val});
            }}
          /></td>
          <td className="right"><Money value={balances[account.id]} />{import_balance_note}</td>
          <td><Link relative to={`/${account.id}`} className="subtle"><span className="fa fa-ellipsis-h"/></Link></td>
        </tr>);
    })
    return (<table className="ledger">
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
  balance: number;
  appstate: AppState;
}
export class AccountView extends React.Component<AccountViewProps, {
  transaction_acount: number;
}> {
  render() {
    let { account, balance, appstate } = this.props;
    let import_balance = getImportBalance(account, balance);
    let import_balance_field;
    let close_button;
    let closed_ribbon;
    let delete_all_transactions_button;
    if (account.closed) {
      close_button = <button onClick={() => {
        manager.store.accounts.unclose(account.id);
      }}>{sss('Reopen')}</button>
      closed_ribbon = <div className="kicked-ribbon">{sss('single-account Closed', 'Closed')}</div>
      delete_all_transactions_button = <SafetySwitch
        onClick={ev => {
          manager.store.accounts.deleteWholeAccount(account.id)
          .then(() => {
            makeToast(sss('Account and transactions deleted'));
          });
        }}>
        {sss('Permanently delete account')}
        </SafetySwitch>
    } else {
      close_button = <SafetySwitch
        onClick={ev => {
          manager.store.accounts.close(account.id)
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

    if (import_balance !== balance) {
      import_balance_field = <div>
        {sss('Synced balance')}: <Money value={import_balance} />
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
      </div>
    }
    return (<div className="padded flex-grow-2" key={account.id}>
      {closed_ribbon}
      <h1>
        <ClickToEdit
          value={account.name}
          placeholder={sss('accounts.name_placeholder', 'no name')}
          onChange={(val) => {
            manager.store.accounts.update(account.id, {name: val});
          }}
        />
      </h1>
      <div className="fieldlist">
        <div>
          {sss('Balance')}: <DebouncedInput
            element={MoneyInput}
            value={balance}
            changeArgIsValue
            onChange={this_months_balance => {
              let diff = account.balance - balance;

              let computed_balance = this_months_balance + diff;
              manager.store.accounts.update(account.id, {balance: computed_balance});
            }}/> ({sss('balance-as-of', (date:JSX.Element) => {
            return <span>as of {date}</span>
          })(<DateDisplay value={appstate.defaultPostingDate} />)})
        </div>
        {import_balance_field}
      </div>
      <TransactionList
        transactions={this.props.transactions}
        appstate={this.props.appstate}
        account={account}
        ending_balance={balance}
        hideAccount
      />

      <div>{close_button} {delete_all_transactions_button}</div>
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
    let accounts_list = appstate.open_accounts;
    if (!accounts_list.length) {
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
        <div className="panes">
          <div className="padded">
            <AccountList
              accounts={accounts_list}
              balances={appstate.account_balances} />
          </div>
          <Route path="/<int:id>">
            <WithRouting func={(routing) => {
              let account = appstate.accounts[routing.params.id];
              if (!account) {
                return <Redirect to='/accounts' />;
              }
              let balance = appstate.account_balances[account.id];
              return (<AccountView
                account={account}
                balance={balance}
                transactions={_.values(appstate.transactions)
                  .filter(t => t.account_id == account.id)}
                appstate={appstate} />);
            }} />
          </Route>
        </div>
      </div>);
  }
  addAccount = () => {
    manager.store.accounts.add(sss('default account name', 'Savings'));
  }
  createConnection = () => {
    setPath('/import')
  }
}
