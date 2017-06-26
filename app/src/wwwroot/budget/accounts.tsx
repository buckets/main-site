import * as React from 'react';
import * as _ from 'lodash';
import * as moment from 'moment';
import {State} from './budget';
import {Account, Balances} from '../../core/models/account';
import {Route, Link, WithRouting} from './routing';
import {Money, MoneyInput} from '../../lib/money';

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
          <td><Link relative to={`/${account.id}`}>{account.name || '???'}</Link></td>
          <td><Money value={balances[account.id]} /></td>
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
  state: State;
}
export class AccountView extends React.Component<AccountViewProps, any> {
  constructor(props) {
    super(props)
    this.state = {
      deposit_amount: 0,
      posted_date: this.computePosted(props.state),
      account_name: props.account.name,
    }
  }
  computePosted(state:State) {
    let today = moment();
    let d = moment(`${state.year}-${state.month}-1`, 'YYYY-MM-DD');
    if (d.month() == today.month() && d.year() == today.year() && d > today) {
      d = today;
    } else if (d < today) {
      d = d.endOf('month');
    } else {
      d = d.startOf('month');
    }
    d = d.utc();
    console.log('posted', d.format());
    return d.utc().format('YYYY-MM-DD HH:mm:ss');
  }
  stateFromProps(props:AccountViewProps) {
    this.setState({
      account_name: props.account.name,
    });
  }
  saveChanges = _.debounce(() => {
    if (this.state.account_name !== this.props.account.name) {
      console.log('saving changes', this.state.account_name);
      return this.props.state.store.accounts.update(this.props.account.id, {
        name: this.state.account_name,
      })  
    }
  }, 400, {leading: false, trailing: true})
  componentWillReceiveProps(nextProps, nextState) {
    this.stateFromProps(nextProps);
  }
  render() {
    let { account, balance, state } = this.props;
    return (<div className="page" key={account.id}>
      <h1><input
        value={this.state.account_name}
        className="ctx-matching-input"
        onChange={(ev) => {
          console.log('setting account name to', ev.target.value);
          this.setState({account_name: ev.target.value}, () => {
            this.saveChanges();  
          })
        }} /></h1>
      Balance: $<Money value={balance} />
      <hr/>
      <MoneyInput
        value={this.state.deposit_amount}
        onChange={(amount) => {
          this.setState({deposit_amount: amount})
        }} />
      {this.state.posted_date}
      <button
        onClick={() => {
          console.log('transacting for', account.id, this.state.deposit_amount);
          state.store.accounts.transact(
            account.id,
            this.state.deposit_amount,
            'test')
          .then(newtrans => {
            console.log('new transaction', newtrans);
          })
        }}>Transact</button>
    </div>)
  }
}

interface AccountsPageProps {
  state: State,
}
export class AccountsPage extends React.Component<AccountsPageProps, any> {
  render() {
    let state = this.props.state;
    return (
      <div className="panes">
        <div className="page">
          <button onClick={this.addAccount}>Create account</button>
          <AccountList
            accounts={_.values(state.accounts)}
            balances={state.balances.accounts} />
        </div>
        <Route path="/<int:id>">
          <WithRouting func={(routing) => {
            let account = state.accounts[routing.params.id];
            let balance = state.balances.accounts[account.id];
            return (<AccountView
              account={account}
              balance={balance}
              state={state} />);
          }} />
        </Route>
      </div>);
  }
  addAccount = () => {
    console.log('Adding account');
    this.props.state.store.accounts.add('Savings');
  }
}
