import * as React from 'react';
import * as _ from 'lodash';
import * as moment from 'moment';
import {State} from './budget';
import {Account, Balances} from '../../core/models/account';
import {Route, Link, WithRouting} from './routing';
import {Money, MoneyInput} from '../../lib/money';
import {Date, DateInput} from './time';

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
export class AccountView extends React.Component<AccountViewProps, {
  deposit_amount: number;
  posted_date: null|moment.Moment;
  account_name: string;
}> {
  constructor(props) {
    super(props)
    this.state = {
      deposit_amount: 0,
      posted_date: null,
      account_name: props.account.name,
    }
  }
  stateFromProps(props:AccountViewProps) {
    let newstate:any = {
      account_name: props.account.name,
    } 
    if (this.state.posted_date) {
      console.log('getting new props');
      let dft_posting = props.state.defaultPostingDate;
      if (dft_posting.year() !== this.state.posted_date.year()
          || dft_posting.month() !== this.state.posted_date.month()) {
        console.log('setting newstate.posted to null');
        newstate.posted_date = null;
      }
    }
    this.setState(newstate);
  }
  saveChanges = _.debounce(() => {
    if (this.state.account_name !== this.props.account.name) {
      return this.props.state.store.accounts.update(this.props.account.id, {
        name: this.state.account_name,
      })  
    }
  }, 400, {leading: false, trailing: true})
  componentWillReceiveProps(nextProps, nextState) {
    this.stateFromProps(nextProps);
  }
  get postedDate() {
    let val = this.state.posted_date || this.props.state.defaultPostingDate;
    return val;
  }
  render() {
    let { account, balance, state } = this.props;
    return (<div className="page" key={account.id}>
      <h1><input
        value={this.state.account_name}
        className="ctx-matching-input"
        onChange={(ev) => {
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
      <DateInput
        value={this.postedDate}
        onChange={(newposteddate) => {
          this.setState({posted_date: newposteddate})
        }} />
      <Date value={this.postedDate} />
      <br/>
      <button
        onClick={() => {
          state.store.accounts.transact({
            account_id: account.id,
            amount: this.state.deposit_amount,
            memo: 'test',
            posted: this.postedDate
          })
          .then(newtrans => {
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
    this.props.state.store.accounts.add('Savings');
  }
}
