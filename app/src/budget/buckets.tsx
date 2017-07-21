import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import * as moment from 'moment'
import { Switch, Route, Link, WithRouting, Redirect } from './routing'
import { Bucket, BucketKind, Group, Transaction, computeBucketData } from '../models/bucket'
import { ts2db, Timestamp, Date, ensureUTCMoment } from '../time'
import {Balances} from '../models/balances'
import { Money, MoneyInput } from '../money'
import { onKeys, DebouncedInput, MonthSelector } from '../input'
import { manager, AppState } from './appstate'
import { ColorPicker } from '../color'
import { makeToast } from './toast'
import { pageY } from '../position'

const NOGROUP = -1;

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

export class KickedBucketsPage extends React.Component<{appstate:AppState},{}> {
  render() {
    let { appstate } = this.props;
    let rows = appstate.kicked_buckets
      .map(bucket => {
        return <tr key={bucket.id}>
          <td>{bucket.name}</td>
          <td><button onClick={() => {
            manager.store.buckets.unkick(bucket.id);
          }}>Un-kick</button></td>
          <td>
            <Link relative to={`../${bucket.id}`} className="subtle">more</Link>
          </td>
        </tr>
      })
    let body;
    if (rows.length === 0) {
      body = <div>You haven't kicked the bucket yet...</div>
    } else {
      body = (
      <div>
        <table className="ledger">
          <thead>
            <tr>
              <th>Bucket</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>);
    }
    return <div className="panes">
      <div className="padded">
        {body}
      </div>
    </div>
  }
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

    let self_debt_amount = 0;
    let total_rain_needed = 0;
    appstate.unkicked_buckets
      .forEach(bucket => {
        let bal = appstate.bucket_balances[bucket.id];
        if (bal < 0) {
          self_debt_amount += bal;
        }
        let computed = computeBucketData(bucket.kind, bucket, {
          today: appstate.defaultPostingDate,
          balance: bal,
        })
        total_rain_needed += computed.deposit;
      })

    let self_debt;
    if (self_debt_amount) {
      self_debt = <div className="labeled-number">
        <div className="label">Self debt</div>
        <div className="value"><Money value={self_debt_amount} /></div>
      </div>
    }
        
    return (
      <Switch>
        <Route path="/<int:id>">
          <WithRouting func={(routing) => {
            let bucket = appstate.buckets[routing.params.id];
            if (!bucket) {
              return <Redirect to='/buckets' />;
            }
            let balance = appstate.bucket_balances[bucket.id];
            return (<BucketView
              bucket={bucket}
              balance={balance}
              appstate={appstate}
              transactions={_.values(appstate.btransactions)
                .filter(trans => trans.bucket_id === bucket.id)} />);
          }} />
        </Route>
        <Route path="">
          <div className="rows">
            <div className="subheader">
              <div className="group">
                <button
                  onClick={this.makeItRain}
                  disabled={appstate.rain<=0}
                  className="makeitrain">Make it rain! <span className="fa fa-tint"/></button>
                <button onClick={this.addBucket}>New bucket</button>
                <button onClick={this.addGroup}>New group</button>
                <div className="labeled-number">
                  <div className="label">Rain<permonth/></div>
                  <div className="value"><Money value={total_rain_needed} /></div>
                </div>
                {self_debt}
              </div>
              <div className="group">
                {rainleft}
                {doPendingButton}
              </div>
            </div>
            <div className="panes">
              <div className="padded">
                <GroupedBucketList
                  buckets={appstate.unkicked_buckets}
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
  makeItRain = () => {
    let { appstate } = this.props;
    let left = appstate.rain;
    let pending = {};
    getGroupedBuckets(appstate.unkicked_buckets, _.values(appstate.groups))
    .forEach(item => {
      let { buckets } = item;
      buckets.forEach(bucket => {
        let computed = computeBucketData(bucket.kind, bucket, {
          today: appstate.defaultPostingDate,
          balance: appstate.bucket_balances[bucket.id],
        })
        let amount = computed.deposit < left ? computed.deposit : left;
        left -= amount;
        pending[bucket.id] = amount;
      })
    })
    this.setState({pending: pending});
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

class ProgressBar extends React.Component<{
  percent:number;
  color?:string;
},{}> {
  render() {
    let { percent, color } = this.props;
    let outerStyle:any = {};
    let innerStyle:any = {
      width: `${percent}%`,
    }
    if (color) {
      outerStyle.borderColor = color;
      innerStyle.backgroundColor = color;
    }
    let label = `${percent}%`
    return <div className={cx("progress-bar", {
          overhalf: percent >= 50,
          complete: percent >= 100,
        })} style={outerStyle}>
      <div className="bar" style={innerStyle}>
        <div className="label">{label}</div>
      </div>
    </div>
  }
}

class BucketKindDetails extends React.Component<{
  bucket: Bucket;
  balance: number;
  posting_date: Timestamp;
}, {
  open: boolean;
}> {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    }
  }
  goalRow() {
    let { bucket } = this.props;
    return <tr key="goal">
      <td>Goal:</td>
      <td>
        <MoneyInput
          value={bucket.goal}
          onChange={_.debounce(val => {
            manager.store.buckets.update(bucket.id, {goal: val});
          }, 250)} />
      </td>
    </tr>
  }
  targetDateRow() {
    let { bucket } = this.props;
    let dt = ensureUTCMoment(bucket.end_date);
    if (!dt || !dt.isValid()) {
      dt = moment.utc();
    }
    let year = dt.year();
    let mon = dt.month() + 1;
    return <tr key="end_date">
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
    </tr>
  }
  depositRow() {
    let { bucket } = this.props;
    return <tr key="deposit">
      <td>Monthly deposit:</td>
      <td>
        <MoneyInput
          value={bucket.deposit}
          onChange={_.debounce(val => {
            manager.store.buckets.update(bucket.id, {deposit: val});
          }, 250)} /><permonth/>
      </td>
    </tr>
  }
  render() {
    let { bucket, balance, posting_date } = this.props;
    let edit_rows = [];
    let computed = computeBucketData(bucket.kind, bucket, {
      today: posting_date,
      balance: balance,
    })
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
            <option value="goal-date">Save X by Y date</option>
            <option value="goal-deposit">Save X by depositing Z/mo</option>
            <option value="deposit-date">Save Z/mo until Y date</option>
          </select>
        </td>
      </tr>)
      switch (bucket.kind) {
        case 'deposit': {
          edit_rows.push(this.depositRow())
          break;  
        }
        case 'goal-deposit': {
          edit_rows.push(this.goalRow())
          edit_rows.push(this.depositRow())
          edit_rows.push(<tr key="end-date">
              <td>Goal completion:</td>
              <td>
                {computed.end_date ? <Date value={computed.end_date} format="MMM YYYY" /> : "some day..."}
              </td>
            </tr>)
          break;
        }
        case 'goal-date': {
          edit_rows.push(this.goalRow())
          edit_rows.push(this.targetDateRow())
          edit_rows.push(<tr key="end-date">
              <td>Required deposit:</td>
              <td>
                <Money value={computed.deposit} /><permonth />
              </td>
            </tr>)
          break;
        }
        case 'deposit-date': {
          edit_rows.push(this.depositRow())
          edit_rows.push(this.targetDateRow())
          edit_rows.push(<tr key="goal">
              <td>
                Ending amount:
              </td>
              <td>
                <Money value={computed.goal} />
              </td>
            </tr>)
          break;
        }
      }
    }
    
    let summary = <span/>;
    if (bucket.kind === 'goal-deposit' || bucket.kind === 'goal-date' || bucket.kind === 'deposit-date') {
      let percent = 0;
      if (computed.goal) {
        percent = Math.floor(balance / computed.goal * 100);
        if (percent < 0) {
          percent = 0;
        }
      }
      if (computed.goal === 0) {
        summary = <div className="goal-summary">
          <span>Goal: 0</span>
          <Date value={computed.end_date} format="MMM YYYY" />
        </div>
      } else {
        summary = <div className="goal-summary">
          <ProgressBar percent={percent} color={bucket.color} />
          <span>Goal: <Money value={computed.goal} /></span>
          <Date value={computed.end_date} format="MMM YYYY" />
        </div>;
      }
    }
    let details;
    if (edit_rows.length) {
      details = <div className="details">
        <table className="props"><tbody>{edit_rows}</tbody></table>
      </div>;
    }
    return <div className={cx("bucket-details", {open: this.state.open})}>
      <div className="summary">
        {summary}
        <a className="editlink" onClick={this.toggleEdit}><span className={cx("fa", {'fa-gear':!this.state.open, 'fa-check':this.state.open})} /></a>
      </div>
      {details}
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
  doPending = async () => {
    let { pending, bucket, posting_date, onPendingChanged } = this.props;
    if (pending) {
      await manager.store.buckets.transact({
        bucket_id: bucket.id,
        amount: pending,
        posted: posting_date,
      })
      onPendingChanged({[bucket.id]: 0});
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
          onKeyDown={onKeys({
            Enter: () => {
              this.doPending();
            },
            ArrowUp: () => {
              console.log('up');
            },
            ArrowDown: () => {
              console.log('down');
            },
          })}
        />
      </td>
      <td className="right"><Money value={computed.deposit} hidezero />{computed.deposit ? <permonth/> : ''}</td>
      <td className="nopad bucket-details-wrap"><BucketKindDetails
          bucket={bucket}
          balance={balance}
          posting_date={posting_date} /></td>
      <td>
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
        <th><span className="fa fa-tint"/> Rain</th>
        <th>Details</th>
        <th></th>
      </tr>
      {bucket_rows}
      <tr className="action-row">
        <td colSpan={6}></td>
        <td><button onClick={this.createBucket}>New bucket</button></td>
      </tr>
    </tbody>);
  }
  createBucket = () => {
    manager.store.buckets.add({name: 'New Bucket', group_id: this.props.group.id})
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
    let { balances, pending, posting_date } = this.props;
    pending = pending || {};

    // let grouped_buckets = {};
    // buckets.forEach(bucket => {
    //   let group_id = bucket.group_id || NOGROUP;
    //   if (!grouped_buckets[group_id]) {
    //     grouped_buckets[group_id] = [];
    //   }
    //   grouped_buckets[group_id].push(bucket);
    // })
    // let groups = this.props.groups.slice();

    // // if there are ungrouped buckets
    // if (grouped_buckets[NOGROUP]) {
    //   groups.push({
    //     id: NOGROUP,
    //     name: 'Misc',
    //     ranking: 'z',
    //   } as Group)
    // }
    let group_elems = getGroupedBuckets(this.props.buckets, this.props.groups)
      .map((item) => {
        let { group, buckets } = item;
        return <GroupRow
          key={group.id}
          group={group}
          buckets={buckets}
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

function getGroupedBuckets(buckets:Bucket[], groups:Group[]) {
  let group_copy = groups.slice();
  let group2buckets = {};
  buckets.forEach(bucket => {
    let group_id = bucket.group_id || NOGROUP;
    if (!group2buckets[group_id]) {
      group2buckets[group_id] = [];
    }
    group2buckets[group_id].push(bucket);
  })

  // if there are ungrouped buckets
  if (group2buckets[NOGROUP]) {
    group_copy.push({
      id: NOGROUP,
      name: 'Misc',
      ranking: 'z',
    } as Group)
  }

  return _(group_copy)
  .sortBy(['ranking', 'name', 'id'])
  .map(group => {
    return {
      group: group,
      buckets: _.sortBy(group2buckets[group.id] || [], ['ranking', 'name', 'id']),
    }
  })
  .value()
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
    let kick_button;
    let kicked_ribbon;
    if (bucket.kicked) {
      kicked_ribbon = <div className="kicked-ribbon">Kicked</div>
      kick_button = <button
        onClick={() => {
          manager.store.buckets.unkick(bucket.id);
        }}>Un-kick the bucket</button>
    } else {
      kick_button = <button
        className="delete"
        onClick={() => {
          manager.store.buckets.kick(bucket.id)
          .then(new_bucket => {
            if (!new_bucket.kicked) {
              // it was deleted
              makeToast('Bucket deleted completely');
            }
          })
        }}>Kick the bucket</button>
    }
    

    return (
      <div className="rows">
        <div className="subheader">
          <div>
            <Link
              relative
              to=".."
              className="back-button"
              ><span className="fa fa-arrow-left"></span></Link>
          </div>
          <div>
            {kick_button}
          </div>
        </div>
        {kicked_ribbon}
        <div className="panes">
          <div className="padded">
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
          </div>
        </div>
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
        let account_id = appstate.transactions[trans.account_trans_id].account_id;
        if (account_id) {
          account_name = appstate.accounts[account_id].name;
        }
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