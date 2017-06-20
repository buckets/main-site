import * as React from 'react';
import * as _ from 'lodash';
import {State} from './budget';
import {Account} from '../../core/models/account';

export class AccountList extends React.Component<{accounts:{}},any> {
  render() {
    console.log('AccountList render', JSON.stringify(this.props.accounts));
    let accounts = _.values(this.props.accounts)
    .map((account:Account) => {
      return (<tr>
          <td>{account.name}</td>
          <td>{account.balance || 0}</td>
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

interface AccountsPageProps {
  state: State,
}
export class AccountsPage extends React.Component<AccountsPageProps, any> {
  render() {

    return (<div>
        <AccountList accounts={this.props.state.accounts} />
        <button onClick={this.addAccount}>Create account</button>
      </div>);
  }
  addAccount = () => {
    this.props.state.store.accounts.add('Savings');
  }
}