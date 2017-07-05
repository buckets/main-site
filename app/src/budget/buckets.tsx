import * as React from 'react'
import * as _ from 'lodash'
import {Route, Link, WithRouting} from './routing'
import {Bucket, Transaction} from '../models/bucket'
import {Balances} from '../models/balances'
import {Money} from '../money'
import {DebouncedInput} from '../input'
import { manager, AppState } from './appstate'


interface BucketsPageProps {
  appstate: AppState;
}
export class BucketsPage extends React.Component<BucketsPageProps, any> {
  render() {
    let { appstate } = this.props;
    return (
      <div className="panes">
        <div className="page">
          <button onClick={this.addBucket}>Create bucket</button>
          <BucketList
            buckets={_.values(appstate.buckets)}
            balances={appstate.bucket_balances} />
        </div>
        <Route path="/<int:id>">
          <WithRouting func={(routing) => {
            let bucket = appstate.buckets[routing.params.id];
            let balance = appstate.bucket_balances[bucket.id];
            return (<BucketView
              bucket={bucket}
              balance={balance}
              appstate={appstate} />);
          }} />
        </Route>
      </div>);
  }
  addBucket = () => {
    manager.store.buckets.add({name: 'new bucket'})
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
        <td><Link relative to={`/${bucket.id}`}>edit</Link></td>
        <td>
          <DebouncedInput
            blendin
            value={bucket.name}
            placeholder="no name"
            onChange={(val) => {
              manager.store.buckets.update(bucket.id, {name: val});
            }}
          />
        </td>
        <td><Money value={balances[bucket.id]} /></td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th></th>
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

interface GroupedBucketListProps {

}
export class GroupedBucketList extends React.Component<GroupedBucketListProps, any> {
  render() {
    return <div>Grouped bucket list</div>
  }
}

interface BucketViewProps {
  bucket: Bucket;
  balance: number;
  appstate: AppState;
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
    let dr = props.appstate.viewDateRange;
    console.log('fetching transactions', dr.before.format(), dr.onOrAfter.format());
    let trans = await manager.store.buckets.listTransactions({
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
    let { bucket, balance } = this.props;
    return (<div className="page" key={bucket.id}>
      <h1>
        <DebouncedInput
          blendin
          value={bucket.name}
          placeholder="no name"
          onChange={(val) => {
            manager.store.buckets.update(bucket.id, {name: val});
          }}
        />
      </h1>
      Balance: $<Money value={balance} />
      <hr/>
    </div>)
  }
}


export class BucketStyles extends React.Component<{buckets: Bucket[]}, {}> {
  render() {
    let guts = this.props.buckets.map(bucket => {
      return `.tag.custom-bucket-style-${bucket.id} { background-color: ${bucket.color || 'var(--blue)'}; }`
    })
    return <style>
      {guts.join('\n')}
    </style>
  }
}