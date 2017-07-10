import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import * as moment from 'moment'
import { Switch, Route, Link, WithRouting } from './routing'
import { Bucket, BucketKind, Group, Transaction, computeBucketData } from '../models/bucket'
import { ts2db, Timestamp, Date, ensureUTCMoment } from '../time'
import {Balances} from '../models/balances'
import { Money, MoneyInput } from '../money'
import { DebouncedInput, MonthSelector } from '../input'
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
    let { to_deposit, to_withdraw } = this.getPending();

    let doPendingLabelParts = [];
    if (to_deposit && to_withdraw && (to_deposit + to_withdraw === 0)) {
      // transfer
      doPendingLabelParts.push(<span key="transfer">Transfer <Money value={to_deposit} symbol nocolor /></span>);
    } else {
      if (to_deposit) {
        doPendingLabelParts.push(<span key="deposit">Deposit <Money value={to_deposit} symbol nocolor /></span>);
      }
      if (to_withdraw) {
        doPendingLabelParts.push(<span key="withdraw">{to_deposit ? ' and withdraw' : 'Withdraw'} <Money value={to_withdraw} symbol nocolor /></span>);
      }
    }
    
    let rainleft;
    if (appstate.rain > 0 && to_deposit) {
      rainleft = <div>(<Money symbol nocolor value={appstate.rain - (to_deposit + to_withdraw)} /> rain left)</div>;
    }

    let doPendingButton;
    if (doPendingLabelParts.length) {
      doPendingButton = <button className="primary" onClick={this.doPending}>{doPendingLabelParts}</button>;
    } else {
      doPendingButton = <button disabled>Deposit/Withdraw</button>;
    }
    return (
      <Switch>
        <Route path="/<int:id>">
          <div className="panes">
            <div className="padded">
              <WithRouting func={(routing) => {
                let bucket = appstate.buckets[routing.params.id];
                let balance = appstate.bucket_balances[bucket.id];
                return (<BucketView
                  bucket={bucket}
                  balance={balance}
                  appstate={appstate}
                  transactions={_.values(appstate.btransactions)
                    .filter(trans => trans.bucket_id === bucket.id)} />);
              }} />
            </div>
          </div>
        </Route>
        <Route path="">
          <div className="rows">
            <div className="subheader">
              <div>
                <button onClick={this.addBucket}>Create bucket</button>
                <button onClick={this.addGroup}>Create group</button>
              </div>
              <div className="group">
                {rainleft}
                {doPendingButton}
              </div>
            </div>
            <div className="panes">
              <div className="padded">
                <GroupedBucketList
                  buckets={_.values(appstate.buckets)}
                  balances={appstate.bucket_balances}
                  groups={_.values(appstate.groups)}
                  onPendingChanged={this.pendingChanged}
                  pending={pending}
                  posting_date={appstate.defaultPostingDate} />
              </div>
            </div>
          </div>
        </Route>
      </Switch>);
  }
  addBucket = () => {
    manager.store.buckets.add({name: 'New Bucket'})
  }
  addGroup = () => {
    manager.store.buckets.addGroup({name: 'New Group'})
  }
  getPending = () => {
    let to_deposit = 0;
    let to_withdraw = 0;
    _.each(this.state.pending, (amount, bucket_id) => {
      if (amount >= 0) {
        to_deposit += amount;
      } else {
        to_withdraw += amount;
      }
    })
    return {to_deposit, to_withdraw};
  }
  doPending = async () => {
    let { to_deposit, to_withdraw } = this.getPending();
    let transfer = (to_deposit && to_withdraw && (to_deposit + to_withdraw === 0));
    _.map(this.state.pending, (amount, bucket_id) => {
      return manager.store.buckets.transact({
        bucket_id: bucket_id,
        amount: amount,
        transfer: transfer,
        posted: this.props.appstate.defaultPostingDate,
      })
    })
    this.setState({pending: {}});
  }
  pendingChanged = (changed:PendingAmounts) => {
    this.setState({pending: Object.assign(this.state.pending, changed)});
  }
}

class BucketKindDetails extends React.Component<{
  bucket: Bucket;
  balance: number;
}, {
  open: boolean;
}> {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    }
  }
  render() {
    let { bucket, balance } = this.props;
    let edit_rows = [];
    if (this.state.open) {
      edit_rows.push(
      <tr key="bucket-type">
        <td>Bucket type:</td>
        <td>
          <select
            value={bucket.kind}
            onChange={(ev) => {
              manager.store.buckets.update(bucket.id, {kind: ev.target.value as BucketKind});
            }}>
            <option value="">Plain old bucket</option>
            <option value="deposit">Recurring expense</option>
            <option value="goal">Saving up</option>
          </select>
        </td>
      </tr>)
      if (bucket.kind === 'deposit') {
        edit_rows.push(
        <tr key="deposit">
          <td>Monthly deposit:</td>
          <td>
            <MoneyInput
              value={bucket.deposit}
              onChange={_.debounce(val => {
                manager.store.buckets.update(bucket.id, {deposit: val});
              }, 250)}/>/mo
          </td>
        </tr>);
      } else if (bucket.kind === 'goal') {
        let dt = ensureUTCMoment(bucket.end_date);
        if (!dt || !dt.isValid()) {
          dt = moment.utc();
        }
        let year = dt.year();
        let mon = dt.month() + 1;
        edit_rows = edit_rows.concat([
          <tr key="goal">
            <td>Goal:</td>
            <td>
              <MoneyInput
                value={bucket.goal}
                onChange={_.debounce(val => {
                  manager.store.buckets.update(bucket.id, {goal: val});
                }, 250)} />
            </td>
          </tr>,
          <tr key="end_date">
            <td>Target date:</td>
            <td>
              <MonthSelector
                year={year}
                month={mon}
                onChange={(year, month) => {
                  let ms = ('0' + month);
                  let newmonth = moment(`${year}-${ms.substr(ms.length-2)}-01`);
                  manager.store.buckets.update(bucket.id, {end_date: ts2db(newmonth)})
                }} />
            </td>
          </tr>,
          <tr key="deposit">
            <td>Monthly deposit:</td>
            <td>
              <MoneyInput
                value={bucket.deposit}
                onChange={_.debounce(val => {
                  manager.store.buckets.update(bucket.id, {deposit: val});
                }, 250)} /> /mo
            </td>
          </tr>
        ])
      }
    }
    let summary;
    if (bucket.kind === 'goal') {
      let percent = 0;
      if (bucket.goal) {
        percent = Math.floor(balance / bucket.goal * 100);
        if (percent < 0) {
          percent = 0;
        }
      }
      summary = <div className="goal-summary">
        <div className="progress-bar">
          <div className="bar" style={{width: `${percent}%`}} />
        </div>
        <Money value={bucket.goal} />
        <Date value={bucket.end_date} format="MMM YYYY" />
      </div>;
    }
    let edit_table;
    if (edit_rows.length) {
      edit_table = <table className="props"><tbody>{edit_rows}</tbody></table>;
    }
    return <div className="bucket-details">
      <div className="summary">
        {summary}
        <a className="editlink subtle fa fa-gear" onClick={this.toggleEdit}/>
      </div>
      {edit_table}
    </div>
  }
  toggleEdit = () => {
    this.setState({open: !this.state.open})
  }
}

interface BucketRowProps {
  bucket: Bucket;
  balance: number;
  posting_date: Timestamp;
  onPendingChanged?: (amounts:PendingAmounts) => any;
  pending?: number;
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
    let { posting_date, bucket, balance, onPendingChanged, pending } = this.props;
    let balance_el;
    if (pending) {
      balance_el = <span>
        <Money key="bal" value={balance} className="strikeout" />
        <span className="fa fa-long-arrow-right change-arrow" />
        <Money key="pend" value={balance + pending} />
      </span>
    } else {
      balance_el = <Money value={balance} />
    }
    let computed = computeBucketData(bucket.kind, bucket, {
      today: posting_date,
      balance: balance,
    })
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
      <td className="right">{balance_el}</td>
      <td className="left">
        <MoneyInput
          value={pending || null}
          onChange={(val) => {
            if (onPendingChanged) {
              onPendingChanged({[bucket.id]: val});
            }
          }}
        />
      </td>
      <td className="right"><Money value={computed.deposit} hidezero />{computed.deposit ? '/mo' : ''}</td>
      <td className="bucket-details-wrap">
        <BucketKindDetails
          bucket={bucket}
          balance={balance} />
      </td>
      <td className="nobr">
        <Link relative to={`/${bucket.id}`} className="subtle">more</Link>
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
  posting_date: Timestamp;
  onPendingChanged?: (amounts:PendingAmounts) => any;
  pending?: PendingAmounts;
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
    let { buckets, group, balances, onPendingChanged, pending, posting_date } = this.props;
    pending = pending || {};
    let bucket_rows = _.sortBy(buckets || [], ['ranking'])
    .map(bucket => {
      return <BucketRow
        key={bucket.id}
        bucket={bucket}
        balance={balances[bucket.id]}
        onPendingChanged={onPendingChanged}
        pending={pending[bucket.id]}
        posting_date={posting_date} />
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
        <th className="nopad noborder"></th>
        <th>Bucket</th>
        <th>Balance</th>
        <th className="left">Transact</th>
        <th>Rain</th>
        <th>Details</th>
        <th></th>
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
  posting_date: Timestamp;
  onPendingChanged?: (amounts:PendingAmounts) => any;
  pending?: PendingAmounts;
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
    let { buckets, balances, pending, posting_date } = this.props;
    pending = pending || {};
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
          onPendingChanged={this.pendingChanged}
          pending={pending}
          posting_date={posting_date} />
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
  transactions: Transaction[];
}
export class BucketView extends React.Component<BucketViewProps, {}> {
  constructor(props) {
    super(props)
  }
  render() {
    let { bucket, balance, transactions, appstate } = this.props;
    return (<div className="padded" key={bucket.id}>
      <Link
        relative
        to=".."
        className="subtle"
        ><span className="fa fa-arrow-left"></span></Link>
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
      <TransactionList
        transactions={transactions}
        appstate={appstate} />
    </div>)
  }
}


class TransactionList extends React.Component<{
  transactions: Transaction[];
  appstate: AppState;
}, {}> {
  render() {
    let { transactions, appstate } = this.props;
    let rows = transactions.map(trans => {
      let account_name;
      if (trans.account_trans_id) {
        account_name = appstate.accounts[trans.account_trans_id].name;
      }
      return <tr key={trans.id}>
        <td className="nobr"><Date value={trans.posted} /></td>
        <td>{trans.memo}</td>
        <td><Money value={trans.amount} /></td>
        <td>{trans.transfer ? 'Transfer' : ''} {account_name}</td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>Posted</th>
          <th>Memo</th>
          <th>Amount</th>
          <th>Misc</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
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