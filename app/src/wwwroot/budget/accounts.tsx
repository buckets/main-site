import * as React from 'react';
import * as _ from 'lodash';
import {State} from './budget';
import {Account, Balances} from '../../core/models/account';
import {Route, Link, WithRouting} from './routing';

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
          <td><Link relative to={`/${account.id}`}>{account.name}</Link></td>
          <td>{balances[account.id] || 0}</td>
        </tr>);
    })
    return (<table className="ledger">
      <thead>
        <tr>
          <th>Account</th>
          <th>Balance</th>
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
  balance: number;
}
export class AccountView extends React.Component<AccountViewProps, any> {
  render() {
    let { account, balance } = this.props;
    return (<div>
      <h1>{account.name}</h1>
      balance: {balance}
    </div>)
  }
}

interface AccountsPageProps {
  state: State,
}
export class AccountsPage extends React.Component<AccountsPageProps, any> {
  render() {
    let state = this.props.state;
    return (<div>
        <div className="panes">
          <div>
            <button onClick={this.addAccount}>Create account</button>
            <AccountList
              accounts={_.values(state.accounts)}
              balances={state.balances.accounts} />
          </div>
          <Route path="/<int:id>">
            <WithRouting func={(routing) => {
              let account = state.accounts[routing.params.id];
              let balance = state.balances.accounts[account.id];
              return (<div>
                  <AccountView account={account} balance={balance} />
                </div>);
            }} />
          </Route>
        </div>
      </div>);
  }
  addAccount = () => {
    console.log('Adding account');
    this.props.state.store.accounts.add('Savings');
  }
}
