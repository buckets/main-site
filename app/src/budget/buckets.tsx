import * as React from 'react'
import * as _ from 'lodash'
import {Route, Link, WithRouting} from './routing'
import {State} from './budget'
import {Bucket, Transaction} from '../models/bucket'
import {Balances} from '../models/balances'
import {Money} from '../money'
import {DebouncedInput} from '../input'


interface BucketsPageProps {
  state: State;
}
export class BucketsPage extends React.Component<BucketsPageProps, any> {
  render() {
    let state = this.props.state;
    return (
      <div className="panes">
        <div className="page">
          <button onClick={this.addBucket}>Create bucket</button>
          <BucketList
            buckets={_.values(state.buckets)}
            balances={state.balances.buckets} />
        </div>
        <Route path="/<int:id>">
          <WithRouting func={(routing) => {
            let bucket = state.buckets[routing.params.id];
            let balance = state.balances.buckets[bucket.id];
            return (<BucketView
              bucket={bucket}
              balance={balance}
              state={state} />);
          }} />
        </Route>
      </div>);
  }
  addBucket = () => {
    this.props.state.store.buckets.add({name: 'new bucket'})
  }
}

interface BucketListProps {
  buckets: Bucket[];
  balances: Balances;
}
export class BucketList extends React.Component<BucketListProps, any> {
  render() {
    let balances = this.props.balances;
    let buckets = this.props.buckets
    .map(bucket => {
      return <tr key={bucket.id}>
        <td><Link relative to={`/${bucket.id}`}>{bucket.name || '???'}</Link></td>
        <td><Money value={balances[bucket.id]} /></td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>Bucket</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {buckets}
      </tbody>
    </table>
  }
}

interface BucketViewProps {
  bucket: Bucket;
  balance: number;
  state: State;
}
export class BucketView extends React.Component<BucketViewProps, {
  transactions: Transaction[];
}> {
  constructor(props) {
    super(props)
    this.state = {
      transactions: [],
    }
    this.refreshTransactions();
  }
  async refreshTransactions(props?:BucketViewProps) {
    props = props || this.props;
    let dr = props.state.viewDateRange;
    console.log('fetching transactions', dr.before.format(), dr.onOrAfter.format());
    let trans = await props.state.store.buckets.listTransactions({
      bucket_id: props.bucket.id,
      // posted: {
      //   before: dr.before,
      //   onOrAfter: dr.onOrAfter,
      // }
    })
    console.log('got transactions', trans);
    this.setState({transactions: trans});
  }
  componentWillReceiveProps(nextProps, nextState) {
    this.refreshTransactions(nextProps);
  }
  render() {
    let { bucket, balance, state } = this.props;
    return (<div className="page" key={bucket.id}>
      <h1><DebouncedInput blendin value={bucket.name} onChange={(val) => {
          state.store.buckets.update(bucket.id, {name: val});
        }} /></h1>
      Balance: $<Money value={balance} />
      <hr/>
    </div>)
  }
}