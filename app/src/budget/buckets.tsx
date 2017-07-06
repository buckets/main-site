import * as React from 'react'
import * as _ from 'lodash'
import {Route, Link, WithRouting} from './routing'
import {Bucket, Group, Transaction} from '../models/bucket'
import {Balances} from '../models/balances'
import { Money, MoneyInput } from '../money'
import {DebouncedInput} from '../input'
import { manager, AppState } from './appstate'
import { ColorPicker } from '../color'


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
          <button onClick={this.addGroup}>Create group</button>
          <GroupedBucketList
            buckets={_.values(appstate.buckets)}
            balances={appstate.bucket_balances}
            groups={_.values(appstate.groups)} />
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
    manager.store.buckets.add({name: 'New Bucket'})
  }
  addGroup = () => {
    manager.store.buckets.addGroup({name: 'New Group'})
  }
}

interface BucketRowProps {
  bucket: Bucket;
  balance: number;
}
class BucketRow extends React.Component<BucketRowProps, {}> {
  render() {
    let { bucket, balance } = this.props;
    return <tr key={bucket.id}>
      <td><span className="fa fa-bars"/></td>
      <td>
        <ColorPicker
          className="small"
          value={bucket.color}
          onChange={(val) => {
            manager.store.buckets.update(bucket.id, {color: val})
          }} />
        <DebouncedInput
          blendin
          value={bucket.name}
          placeholder="no name"
          onChange={(val) => {
            manager.store.buckets.update(bucket.id, {name: val});
          }}
        />
        <Link relative to={`/${bucket.id}`} className="fa fa-gear"></Link>
      </td>
      <td className="right"><Money value={balance} /></td>
      <td><MoneyInput value={0} onChange={() => {}}/></td>
      <td className="right">12.22/mo</td>
      <td>goal</td>
    </tr>
  }
}

interface GroupedBucketListProps {
  groups: Group[];
  buckets: Bucket[];
  balances: Balances;
}
export class GroupedBucketList extends React.Component<GroupedBucketListProps, any> {
  render() {
    let { buckets, balances } = this.props;
    const NOGROUP = -1;
    let grouped_buckets = {};
    buckets.forEach(bucket => {
      let group_id = bucket.group_id || NOGROUP;
      if (!grouped_buckets[group_id]) {
        grouped_buckets[group_id] = [];
      }
      grouped_buckets[group_id].push(bucket);
    })
    let groups = this.props.groups.slice();

    // if there are ungrouped buckets
    if (grouped_buckets[NOGROUP]) {
      groups.push({
        id: NOGROUP,
        name: 'Misc',
        ranking: 'z',
      } as Group)
    }
    let group_elems = _.sortBy(groups, ['ranking'])
      .map((group:Group) => {
        let bucket_rows = (grouped_buckets[group.id] || [])
        .map(bucket => {
          return <BucketRow key={bucket.id} bucket={bucket} balance={balances[bucket.id]} />
        })
        return [
        <thead key={`group-${group.id}`}>
          <tr>
            <th><span className="fa fa-bars"/></th>
            <th colSpan={100}>
            <DebouncedInput
              blendin
              value={group.name}
              placeholder="no name"
              onChange={(val) => {
                manager.store.buckets.updateGroup(group.id, {name: val});
              }}
            /></th>
          </tr>
        </thead>,
        <tbody key={`buckets-${group.id}`}>
          {bucket_rows}
        </tbody>
        ]
      })
    return <table className="ledger">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Balance</th>
          <th>Transaction</th>
          <th>Monthly Deposit</th>
          <th>Goal</th>
        </tr>
      </thead>
      {group_elems}
    </table>
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
    this.setState({transactions: trans});
  }
  componentWillReceiveProps(nextProps, nextState) {
    this.refreshTransactions(nextProps);
  }
  render() {
    let { bucket, balance } = this.props;
    return (<div className="page" key={bucket.id}>
      <h1>
        <ColorPicker
        value={bucket.color}
        onChange={(val) => {
          manager.store.buckets.update(bucket.id, {color: val})
        }} />
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