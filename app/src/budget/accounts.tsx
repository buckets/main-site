import * as React from 'react'
import * as _ from 'lodash'
import {Balances} from '../models/balances'
import {Account, Transaction} from '../models/account'
import {Route, Link, WithRouting} from './routing'
import {Money} from '../money'
import {TransactionList} from './transactions'
import {DebouncedInput} from '../input';
import { manager, AppState } from './appstate';

interface AccountListProps {
  accounts: Account[];
  balances: Balances;
}
export class AccountList extends React.Component<AccountListProps,any> {
  render() {
    let balances = this.props.balances;
    let accounts = this.props.accounts
    .map((account:Account) => {
      return (<tr key={account.id}>
          <td><DebouncedInput
            blendin
            value={account.name}
            placeholder="no name"
            onChange={(val) => {
              manager.store.accounts.update(account.id, {name: val});
            }}
          /></td>
          <td><Money value={balances[account.id]} /></td>
          <td><Link relative to={`/${account.id}`} className="subtle">more</Link></td>
        </tr>);
    })
    return (<table className="ledger">
      <thead>
        <tr>
          <th>Account</th>
          <th>Balance</th>
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
    let { account, balance } = this.props;
    return (<div className="padded" key={account.id}>
      <h1>
        <DebouncedInput
          blendin
          value={account.name}
          placeholder="no name"
          onChange={(val) => {
            manager.store.accounts.update(account.id, {name: val});
          }}
        />
      </h1>
      Balance: $<Money value={balance} />
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
    return (
      <div className="rows">
        <div className="subheader">
          <button onClick={this.addAccount}>Create account</button>
        </div>
        <div className="panes">
          <div className="padded">
            <AccountList
              accounts={_.values(appstate.accounts)}
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
    manager.store.accounts.add('Savings');
  }
}
