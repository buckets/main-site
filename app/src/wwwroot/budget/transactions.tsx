import * as React from 'react';
// import * as _ from 'lodash';
import {State} from './budget';
import {Transaction} from '../../core/models/account';
import {Date} from './time';
// import {Route, Link, WithRouting} from './routing';
import {Money} from '../../lib/money';


interface TransactionListProps {
  transactions: Transaction[],
  state: State,
}
export class TransactionList extends React.Component<TransactionListProps, any> {
  render() {
    let elems = this.props.transactions.map(trans => {
      return <tr key={trans.id}>
        <td><Date value={trans.posted} /></td>
        <td>{trans.account_id}</td>
        <td>{trans.memo}</td>
        <td><Money value={trans.amount} /></td>
        <td></td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>Posted</th>
          <th>Account</th>
          <th>Memo</th>
          <th>Amount</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
        {elems}
      </tbody>
    </table>
  }
}