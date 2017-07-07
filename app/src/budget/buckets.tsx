import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import {Route, Link, WithRouting} from './routing'
import {Bucket, Group, Transaction} from '../models/bucket'
import {Balances} from '../models/balances'
import { Money, MoneyInput } from '../money'
import {DebouncedInput} from '../input'
import { manager, AppState } from './appstate'
import { ColorPicker } from '../color'

const NOGROUP = -1;

function pageY(elem):number {
  let result = elem.offsetTop;
  while (elem.offsetParent) {
    elem = elem.offsetParent;
    result += elem.offsetTop;
  }
  return result;
}

function overTopOrBottom(ev):'top'|'bottom' {
  let yoffset = ev.pageY - pageY(ev.currentTarget);
  let percent = yoffset / ev.currentTarget.offsetHeight;
  let dropHalf:'top'|'bottom' = 'top';
  if (percent >= 0.5) {
    dropHalf = 'bottom';
  }
  return dropHalf;
}


interface PendingAmounts {
  [k:number]: number;
}


interface BucketsPageProps {
  appstate: AppState;
}
export class BucketsPage extends React.Component<BucketsPageProps, {
  pending: PendingAmounts;
}> {
  constructor(props) {
    super(props)
    this.state = {
      pending: {},
    }
  }
  render() {
    let { appstate } = this.props;
    let { pending } = this.state;
    let pending_deposits = 0;
    let pending_withdrawls = 0;
    _.each(pending, (amount, bucket_id) => {
      if (amount >= 0) {
        pending_deposits += amount;
      } else {
        pending_withdrawls += amount;
      }
    })
    let doPendingLabelParts = [];
    if (pending_deposits) {
      doPendingLabelParts.push(<span key="deposit">Deposit <Money value={pending_deposits} /></span>);
    }
    if (pending_withdrawls) {
      doPendingLabelParts.push(<span key="withdraw">Withdraw <Money value={pending_withdrawls} /></span>);
    }
    let doPendingButton;
    if (doPendingLabelParts.length) {
      doPendingButton = <button onClick={this.doPending}>{doPendingLabelParts}</button>;
    } else {
      doPendingButton = <button disabled>Deposit/Withdraw</button>;
    }
    return (
      <div className="rows">
        <div className="subheader">
          <button onClick={this.addBucket}>Create bucket</button>
          <button onClick={this.addGroup}>Create group</button>
          {doPendingButton}
        </div>
        <div className="panes">
          <div className="padded">
            <GroupedBucketList
              buckets={_.values(appstate.buckets)}
              balances={appstate.bucket_balances}
              groups={_.values(appstate.groups)}
              onPendingChanged={this.pendingChanged} />
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
        </div>
      </div>);
  }
  addBucket = () => {
    manager.store.buckets.add({name: 'New Bucket'})
  }
  addGroup = () => {
    manager.store.buckets.addGroup({name: 'New Group'})
  }
  doPending = () => {
    console.log('doPending', this.state.pending);
  }
  pendingChanged = (changed:PendingAmounts) => {
    console.log('pending Changed', changed);
    this.setState({pending: Object.assign(this.state.pending, changed)});
  }
}

interface BucketRowProps {
  bucket: Bucket;
  balance: number;
  onPendingChanged?: (amounts:PendingAmounts) => any;
}
class BucketRow extends React.Component<BucketRowProps, {
  isDragging: boolean;
  underDrag: boolean;
  dropHalf: 'top'|'bottom';
}> {
  constructor(props) {
    super(props);
    this.state = {
      isDragging: false,
      underDrag: false,
      dropHalf: 'top',
    }
  }
  render() {
    let { bucket, balance, onPendingChanged } = this.props;
    return <tr
      key={bucket.id}
      onDragOver={this.onDragOver}
      onDrop={this.onDrop}
      onDragLeave={this.onDragLeave}
      className={cx({
        underDrag: this.state.underDrag,
        isDragging: this.state.isDragging,
        dropTopHalf: this.state.underDrag && this.state.dropHalf === 'top',
        dropBottomHalf: this.state.underDrag && this.state.dropHalf === 'bottom',
      })}
    >
      <td className="nopad noborder">
        <div
          className="drophandle"
          draggable
          onDragStart={this.onDragStart}
          onDragEnd={this.onDragEnd}>
            <span className="fa fa-bars"/>
        </div>
      </td>
      <td className="nobr">
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
      </td>
      <td className="right"><Money value={balance} /></td>
      <td>
        <MoneyInput
          onChange={(val) => {
            if (onPendingChanged) {
              onPendingChanged({[bucket.id]: val});
            }
          }}
        />
      </td>
      <td className="right">12.22/mo</td>
      <td>goal</td>
      <td className="nobr">
        <DebouncedInput
          blendin
          value={bucket.name}
          placeholder="no name"
          onChange={(val) => {
            manager.store.buckets.update(bucket.id, {name: val});
          }}
        />
        <Link relative to={`/${bucket.id}`} className="subtle fa fa-gear"></Link>
      </td>
    </tr>
  }

  //----------------------------------
  // Draggable
  //----------------------------------
  onDragStart = (ev) => {
    ev.dataTransfer.setData('bucket', this.props.bucket.id);
    ev.dataTransfer.effectAllowed = 'move';
    this.setState({isDragging: true});
  }
  onDragEnd = (ev) => {
    this.setState({isDragging: false});
  }

  //----------------------------------
  // Drop zone
  //----------------------------------
  onDrop = (ev) => {
    if (this.canAcceptDrop(ev)) {
      ev.preventDefault();
      _.each(ev.dataTransfer.items, item => {
        let bucket_id = ev.dataTransfer.getData(item.type);
        if (bucket_id !== this.props.bucket.id) {
          const placement = this.state.dropHalf === 'top' ? 'before' : 'after';
          manager.store.buckets.moveBucket(bucket_id, placement, this.props.bucket.id)
        }
      })
      this.setState({
        underDrag: false,
      })
    }
  }

  onDragOver = (ev) => {
    if (this.canAcceptDrop(ev)) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      this.setState({
        underDrag: true,
        dropHalf: overTopOrBottom(ev),
      });
    }
  }
  onDragLeave = (ev) => {
    if (this.canAcceptDrop(ev)) {
      ev.preventDefault();
      this.setState({underDrag: false});
    }
  }
  canAcceptDrop = (ev):boolean => {
    return _.includes(ev.dataTransfer.types, 'bucket');
  }
}


class GroupRow extends React.Component<{
  group: Group;
  buckets: Bucket[];
  balances: Balances;
  onPendingChanged?: (amounts:PendingAmounts) => any;
}, {
  isDragging: boolean;
  underDrag: boolean;
  dropHalf: 'top'|'bottom';
}> {
  constructor(props) {
    super(props)
    this.state = {
      isDragging: false,
      underDrag: false,
      dropHalf: 'top',
    }
  }
  render() {
    let { buckets, group, balances, onPendingChanged } = this.props;
    let bucket_rows = _.sortBy(buckets || [], ['ranking'])
    .map(bucket => {
      return <BucketRow
        key={bucket.id}
        bucket={bucket}
        balance={balances[bucket.id]}
        onPendingChanged={onPendingChanged} />
    })
    return (
      <tbody
        key={`group-${group.id}`}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}
        onDragLeave={this.onDragLeave}
        >
      <tr className="group-row">
        <td className={cx(
          'nopad',
          'noborder', 
          {
            underDrag: this.state.underDrag,
            isDragging: this.state.isDragging,
            dropTopHalf: this.state.underDrag && this.state.dropHalf === 'top',
            dropBottomHalf: this.state.underDrag && this.state.dropHalf === 'bottom',
          })}>
          <div
            className="drophandle"
            draggable={group.id !== NOGROUP}
            onDragStart={this.onDragStart}
            onDragEnd={this.onDragEnd}>
              <span className="fa fa-bars"/>
          </div>
        </td>
        <td colSpan={100} className="group-name">
        <DebouncedInput
          blendin
          value={group.name}
          placeholder="no name"
          onChange={(val) => {
            manager.store.buckets.updateGroup(group.id, {name: val});
          }}
        /></td>
      </tr>
      <tr>
        <th className="border"></th>
        <th>Bucket</th>
        <th>Balance</th>
        <th>Deposit/Withdraw</th>
        <th>Monthly Deposit</th>
        <th>Goal</th>
        <th>Name</th>
      </tr>
      {bucket_rows}
    </tbody>);
  }
  //----------------------------------
  // Draggable
  //----------------------------------
  onDragStart = (ev) => {
    ev.dataTransfer.setData('group', this.props.group.id);
    ev.dataTransfer.effectAllowed = 'move';
    this.setState({isDragging: true});
  }
  onDragEnd = (ev) => {
    this.setState({isDragging: false});
  }

  //----------------------------------
  // Drop zone
  //----------------------------------
  onDrop = (ev) => {
    if (this.canAcceptDrop(ev)) {
      ev.preventDefault();
      _.each(ev.dataTransfer.items, item => {
        if (item.type === 'group') {
          let group_id = ev.dataTransfer.getData(item.type);
          if (group_id !== this.props.group.id) {
            const placement = this.state.dropHalf === 'top' ? 'before' : 'after';
            manager.store.buckets.moveGroup(group_id, placement, this.props.group.id);
          }
        } else if (item.type === 'bucket') {
          let bucket_id = ev.dataTransfer.getData(item.type);
          manager.store.buckets.update(bucket_id, {group_id: this.props.group.id})
        }
      })
      this.setState({
        underDrag: false,
      })
    }
  }

  onDragOver = (ev) => {
    if (this.canAcceptDrop(ev)) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      this.setState({
        underDrag: true,
        dropHalf: overTopOrBottom(ev),
      });
    }
  }
  onDragLeave = (ev) => {
    if (this.canAcceptDrop(ev)) {
      ev.preventDefault();
      this.setState({underDrag: false});
    }
  }
  canAcceptDrop = (ev):boolean => {
    if (this.props.buckets.length === 0) {
      // I'm an empty group; I will accept buckets
      return _.includes(ev.dataTransfer.types, 'group')
        || _.includes(ev.dataTransfer.types, 'bucket');
    } else {
      return _.includes(ev.dataTransfer.types, 'group');  
    }
  }
}


interface GroupedBucketListProps {
  groups: Group[];
  buckets: Bucket[];
  balances: Balances;
  onPendingChanged?: (amounts:PendingAmounts) => any;
}
export class GroupedBucketList extends React.Component<GroupedBucketListProps, {}> {
  constructor(props) {
    super(props)
  }
  pendingChanged = (changed:PendingAmounts) => {
    if (this.props.onPendingChanged) {
      this.props.onPendingChanged(changed);
    }
  }
  render() {
    let { buckets, balances } = this.props;    
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
    let group_elems = _.sortBy(groups, ['ranking', 'name'])
      .map((group:Group) => {
        return <GroupRow
          key={group.id}
          group={group}
          buckets={grouped_buckets[group.id] || []}
          balances={balances}
          onPendingChanged={this.pendingChanged} />
      })
    return <table className="ledger">
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
    return (<div className="padded" key={bucket.id}>
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