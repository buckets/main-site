import * as React from 'react'
import * as _ from 'lodash'
import * as moment from 'moment'
import {Balances} from '../models/balances'
import {Account, Transaction} from '../models/account'
import {Route, Link, WithRouting} from './routing'
import {Money, MoneyInput} from '../money'
import {Date, DateInput} from '../time'
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
          <td><Link relative to={`/${account.id}`}>edit</Link></td>
          <td><DebouncedInput
            blendin
            value={account.name}
            placeholder="no name"
            onChange={(val) => {
              manager.store.accounts.update(account.id, {name: val});
            }}
          /></td>
          <td><Money value={balances[account.id]} /></td>
        </tr>);
    })
    return (<table className="ledger">
      <thead>
        <tr>
          <th></th>
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
  appstate: AppState;
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
      let dft_posting = props.appstate.defaultPostingDate;
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
    let val = this.state.posted_date || this.props.appstate.defaultPostingDate;
    return val;
  }
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
          manager.store.accounts.transact({
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
         appstate={this.props.appstate}
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
      <div className="panes">
        <div className="padded">
          <button onClick={this.addAccount}>Create account</button>
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
      </div>);
  }
  addAccount = () => {
    manager.store.accounts.add('Savings');
  }
}
