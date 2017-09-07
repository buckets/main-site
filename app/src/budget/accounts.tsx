import * as React from 'react'
import * as _ from 'lodash'
import * as moment from 'moment'
import { sss } from '../i18n'
import { shell } from 'electron'
import {Balances} from '../models/balances'
import { Account, Transaction, expectedBalance } from '../models/account'
import {Route, Link, WithRouting} from './routing'
import { Money, MoneyInput } from '../money'
import {TransactionList} from './transactions'
import { DebouncedInput, debounceChange} from '../input';
import { manager, AppState } from './appstate';
import { setPath } from './budget';
import { Help } from '../tooltip'
import { Date } from '../time'

function getImportBalance(account:Account, balance:number):number {
  return expectedBalance(account) - (account.balance - balance);
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
        </div>}>{sss('accounts.balance_mismatch_msg', 'The most recent synced balance does not match the balance computed from transactions.  Click more for more information.')}</Help>

      }
      return (<tr key={account.id}>
          <td><DebouncedInput
            blendin
            value={account.name}
            placeholder={sss('accounts.name_placeholder', 'no name')}
            onChange={(val) => {
              manager.store.accounts.update(account.id, {name: val});
            }}
          /></td>
          <td>{import_balance_note}<Money value={balances[account.id]} /></td>
          <td><Link relative to={`/${account.id}`} className="subtle">{sss('accounts.more_link', 'more')}</Link></td>
        </tr>);
    })
    return (<table className="ledger">
      <thead>
        <tr>
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
export class AccountView extends React.Component<AccountViewProps, {}> {
  render() {
    let { account, balance, appstate } = this.props;
    let import_balance = getImportBalance(account, balance);
    let import_balance_field;
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
    return (<div className="padded" key={account.id}>
      <h1>
        <DebouncedInput
          blendin
          value={account.name}
          placeholder={sss('accounts.name_placeholder', 'no name')}
          onChange={(val) => {
            manager.store.accounts.update(account.id, {name: val});
          }}
        />
      </h1>
      <div className="fieldlist">
        <div>
          {sss('Balance')}: <MoneyInput
          value={balance}
          onChange={debounceChange(this_months_balance => {
            let diff = account.balance - balance;

            let computed_balance = this_months_balance + diff;
            manager.store.accounts.update(account.id, {balance: computed_balance});
          })}/> ({sss('balance-as-of', (d:moment.Moment) => {
            return <span>as of <Date value={d} /></span>
          })(appstate.defaultPostingDate)})
        </div>
        {import_balance_field}
      </div>
      <TransactionList
        transactions={this.props.transactions}
        appstate={this.props.appstate}
        account={account}
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
    let accounts_list = _.values(appstate.accounts);
    if (!accounts_list.length) {
      getting_started = <div className="notice">
        First time using Buckets?  Check out the <a href="#" onClick={() => {
          shell.openExternal('https://www.bucketsisbetter.com/gettingstarted');
        }}>Getting Started Videos.</a>
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
    setPath('/connections')
  }
}
