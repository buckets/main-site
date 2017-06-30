import * as React from 'react'
import * as _ from 'lodash'
import * as moment from 'moment'
import {Balances} from '../models/balances'
import {Account, Transaction} from '../models/account'
import {Route, Link, WithRouting} from './routing'
import {Money, MoneyInput} from '../money'
import {Date, DateInput} from '../time'
import {TransactionList} from './transactions'
import {State} from './budget'
import {DebouncedInput} from '../input';

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
  transactions: Transaction[];
  balance: number;
  state: State;
}
export class AccountView extends React.Component<AccountViewProps, {
  deposit_amount: number;
  posted_date: null|moment.Moment;
}> {
  constructor(props) {
    super(props)
    this.state = {
      deposit_amount: 0,
      posted_date: null,
    }
  }
  stateFromProps(props:AccountViewProps) {
    let newstate:any = {}
    if (this.state.posted_date) {
      let dft_posting = props.state.defaultPostingDate;
      if (dft_posting.year() !== this.state.posted_date.year()
          || dft_posting.month() !== this.state.posted_date.month()) {
        newstate.posted_date = null;
      }
    }
    this.setState(newstate);
  }
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
      <h1>
        <DebouncedInput blendin value={account.name} onChange={(val) => {
          state.store.accounts.update(account.id, {name: val});
        }} />
      </h1>
      Balance: $<Money value={balance} />
      <hr/>
      <div>
        <MoneyInput
          value={this.state.deposit_amount}
          onChange={(amount) => {
            this.setState({deposit_amount: amount})
          }} />
      </div>
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
       <hr/>
       <TransactionList
         transactions={this.props.transactions}
         state={this.props.state}
         hideAccount
       />
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
              transactions={state.transactions.filter(t => t.account_id == account.id)}
              state={state} />);
          }} />
        </Route>
      </div>);
  }
  addAccount = () => {
    this.props.state.store.accounts.add('Savings');
  }
}
