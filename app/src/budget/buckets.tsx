import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import { Switch, Route, Link, WithRouting, Redirect } from './routing'
import { Bucket, BucketKind, Group, Transaction, computeBucketData } from '../models/bucket'
import { ts2db, Timestamp, DateDisplay, utcToLocal, localNow, makeLocalDate, PerMonth } from '../time'
import {Balances} from '../models/balances'
import { Money, MoneyInput } from '../money'
import { onKeys, MonthSelector, ClickToEdit } from '../input'
import { manager, AppState } from './appstate'
import { ColorPicker } from '../color'
import { makeToast } from './toast'
import { pageY } from '../position'
import { Help } from '../tooltip'
import { BucketBalanceChart } from '../charts/balancechart'
import { sss } from '../i18n'
import { isNil } from '../util'
import { NoteMaker } from './notes'

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
          }}>{sss('Un-kick')}</button></td>
          <td>
            <Link relative to={`../${bucket.id}`} className="subtle">{sss('more')}</Link>
          </td>
        </tr>
      })
    let body;
    if (rows.length === 0) {
      body = <div>{sss("You haven't kicked the bucket yet...")}</div>
    } else {
      body = (
      <div>
        <table className="ledger">
          <thead>
            <tr>
              <th>{sss('Bucket')}</th>
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

    let pendingInfo = [];
    if (to_deposit) {
      pendingInfo.push(<div key="deposit" className="labeled-number">
        <div className="label">{sss('In')}</div>
        <div className="value"><Money value={to_deposit} symbol alwaysShowDecimal/></div>
      </div>);
    }
    if (to_withdraw) {
      pendingInfo.push(<div key="withdraw" className="labeled-number">
        <div className="label">{sss('Out')}</div>
        <div className="value"><Money value={to_withdraw} symbol alwaysShowDecimal /></div>
      </div>)
    }
    if (to_deposit && to_withdraw) {
      let amount;
      if (to_deposit + to_withdraw) {
        amount = <Money value={to_deposit + to_withdraw} symbol alwaysShowDecimal />
      } else {
        amount = <span className="fa fa-fw fa-check" />
      }
      pendingInfo.push(<div key="net" className="labeled-number">
        <div className="label">{sss('Net')} <Help className="right">{sss('If Net is 0, the bucket transactions will be marked as transfers rather than as income or expenses.')}</Help></div>
        <div className="value">{amount}</div>
      </div>)
    }
    
    let rainleft;
    if (appstate.rain > 0 && to_deposit) {
      rainleft = <div className="labeled-number">
        <div className="label">{sss('Rain left')}</div>
        <div className="value"><Money value={appstate.rain - (to_deposit + to_withdraw)} symbol nocolor alwaysShowDecimal /></div>
      </div>;
    }

    let doPendingButton;
    if (to_deposit || to_withdraw) {
      doPendingButton = <button className="primary" onClick={this.doPending}>{sss('Make it so')}</button>;
    } else {
      doPendingButton = <button disabled>{sss('Make it so')}</button>;
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
    let show_nodebt_balance = false;
    if (self_debt_amount) {
      self_debt = <div className="labeled-number">
        <div className="label">
          {sss('Self debt')} <Help>{sss('Amount of money over-allocated in buckets.')}</Help>
        </div>
        <div className="value"><Money value={self_debt_amount} className="faint-cents" alwaysShowDecimal /></div>
      </div>
      show_nodebt_balance = true;
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
            let rainfall = appstate.rainfall[bucket.id];
            return (<BucketView
              bucket={bucket}
              rainfall={rainfall}
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
                  className="makeitrain">{sss('Make it rain!')} <span className="fa fa-tint"/></button>
                <button onClick={this.addBucket}>{sss('action.New bucket', 'New bucket')}</button>
                <button onClick={this.addGroup}>{sss('action.New group', 'New group')}</button>
                <div className="labeled-number">
                  <div className="label">
                    {sss('Rain')}<PerMonth/>&nbsp;<Help>{sss('Total amount your buckets expect each month.')}</Help>
                  </div>
                  <div className="value"><Money value={total_rain_needed} className="faint-cents" alwaysShowDecimal /></div>
                </div>
                {self_debt}
              </div>
              <div className="group">
                {rainleft}
                {pendingInfo}
                {doPendingButton}
              </div>
            </div>
            <div className="panes">
              <div className="padded">
                <GroupedBucketList
                  buckets={appstate.unkicked_buckets}
                  balances={appstate.bucket_balances}
                  rainfall={appstate.rainfall}
                  nodebt_balances={appstate.nodebt_balances}
                  show_nodebt_balance={show_nodebt_balance}
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
    manager.store.buckets.add({name: sss('default new bucket name', 'New Bucket')})
  }
  addGroup = () => {
    manager.store.buckets.addGroup({name: sss('default new group name', 'New Group')})
  }
  makeItRain = () => {
    let { appstate } = this.props;
    let left = appstate.rain;
    let pending = {};
    getGroupedBuckets(appstate.unkicked_buckets, Object.values(appstate.groups))
    .forEach(item => {
      let { buckets } = item;
      buckets.forEach((bucket:Bucket) => {
        let computed = computeBucketData(bucket.kind, bucket, {
          today: appstate.defaultPostingDate,
          balance: appstate.bucket_balances[bucket.id],
        })
        let rainfall = appstate.rainfall[bucket.id] || 0;
        let ask = computed.deposit - rainfall;
        ask = ask < 0 ? 0 : ask;
        let amount = ask < left ? ask : left;
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

class ProgressBubble extends React.Component<{
  percent:number;
  color?:string;
  width?:string;
  height?:string;
  className?:string;
}, {}> {
  render() {
    let { percent, color, width, height, className } = this.props;
    let outerStyle:any = {};
    let innerStyle:any = {};
    let fill_amount = 0;
    if (isNaN(percent)) {
      percent = 0;
    }
    if (percent < 80) {
      fill_amount = percent;
    } else if (percent >= 100) {
      fill_amount = 100;
    } else {
      // between 80-100%
      fill_amount = 80;
    }
    innerStyle.height = `${fill_amount}%`;
    if (width) {
      outerStyle.width = width;
    }
    if (height) {
      outerStyle.height = height;
    }
    if (color) {
      outerStyle.borderColor = color;
      innerStyle.backgroundColor = color;
    }
    return <div
      className={cx("progress-bubble", className, {
        full: percent >= 100,
        empty: percent <= 0,
      })}
      style={outerStyle}>
      <div
        className="bubble-fill"
        style={innerStyle}></div>
    </div>
  }
}

class ProgressBar extends React.Component<{
  percent:number;
  color?:string;
  width?:string;
},{}> {
  render() {
    let { percent, color, width } = this.props;
    let outerStyle:any = {};
    let innerStyle:any = {
      width: `${percent}%`,
    }
    if (color) {
      outerStyle.borderColor = color;
      innerStyle.backgroundColor = color;
    }
    if (width) {
      outerStyle.width = width;
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
      <td>{sss('Goal:')}</td>
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
    let dt = utcToLocal(bucket.end_date);
    if (!dt || !dt.isValid()) {
      dt = localNow();
    }
    return <tr key="end_date">
      <td>{sss('Target date:')}</td>
      <td>
        <MonthSelector
          month={dt.month()}
          year={dt.year()}
          onChange={({month, year}) => {
            let new_date = makeLocalDate(year, month, 1);
            manager.store.buckets.update(bucket.id, {end_date: ts2db(new_date)})
          }} />
      </td>
    </tr>
  }
  depositRow() {
    let { bucket } = this.props;
    return <tr key="deposit">
      <td>{sss('Monthly deposit:')}</td>
      <td>
        <MoneyInput
          value={bucket.deposit}
          onChange={_.debounce(val => {
            manager.store.buckets.update(bucket.id, {deposit: val});
          }, 250)} /><PerMonth/>
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
        <td>{sss('Bucket type:')}</td>
        <td>
          <select
            value={bucket.kind}
            onChange={(ev) => {
              manager.store.buckets.update(bucket.id, {kind: ev.target.value as BucketKind});
            }}>
            <option value="">{sss('buckettype.plain', 'Plain old bucket')}</option>
            <option value="deposit">{sss('buckettype.deposit', 'Recurring expense')}</option>
            <option value="goal-date">{sss('buckettype.goal-date', 'Save X by Y date')}</option>
            <option value="goal-deposit">{sss('buckettype.goal-deposit', 'Save X by depositing Z/mo')}</option>
            <option value="deposit-date">{sss('buckettype.deposit-date', 'Save Z/mo until Y date')}</option>
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
              <td>{sss('Goal completion:')}</td>
              <td>
                {computed.end_date ? <DateDisplay value={computed.end_date} format="MMM YYYY" /> : sss("some day...")}
              </td>
            </tr>)
          break;
        }
        case 'goal-date': {
          edit_rows.push(this.goalRow())
          edit_rows.push(this.targetDateRow())
          edit_rows.push(<tr key="end-date">
              <td>{sss('Required deposit:')}</td>
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
                {sss('Ending amount:')}
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
          <span>{sss('Goal: 0')}</span>
          <DateDisplay value={computed.end_date} format="MMM YYYY" />
        </div>
      } else {
        summary = <div className="goal-summary">
          <ProgressBar percent={percent} color={bucket.color} />
          <span>{sss('Goal:')} <Money value={computed.goal} /></span>
          <DateDisplay value={computed.end_date} format="MMM YYYY" />
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
  rainfall: number;
  nodebt_balance: number;
  show_nodebt_balance?: boolean;
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
    let { posting_date, bucket, balance, rainfall, nodebt_balance, show_nodebt_balance, onPendingChanged, pending } = this.props;
    let balance_el;
    if (pending) {
      balance_el = <span>
        <Money value={balance} className="strikeout" />
        <span className="fa fa-long-arrow-right change-arrow" />
        <Money value={balance + pending} />
      </span>
    } else {
      balance_el = <Money value={balance} className="faint-cents" alwaysShowDecimal />
    }
    let computed = computeBucketData(bucket.kind, bucket, {
      today: posting_date,
      balance: balance,
    })

    let rainfall_indicator;
    if (computed.deposit) {
      let percent = rainfall/computed.deposit*100;
      rainfall_indicator = <Help
        icon={<ProgressBubble height="1rem" percent={percent} />}>
        {sss('rainfall-received-this-month', (money:JSX.Element, percent:number) => {
          return <span>Rainfall received this month: {money} ({percent}%)</span>
        })(<Money value={rainfall}/>, Math.floor(percent))}
      </Help>
    }

    return <tr
      key={bucket.id}
      onDragOver={this.onDragOver}
      onDrop={this.onDrop}
      onDragLeave={this.onDragLeave}
      className={cx('note-hover-trigger', {
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
        <NoteMaker
          obj={bucket}
        />
        <ClickToEdit
          value={bucket.name}
          placeholder="no name"
          onChange={(val) => {
            manager.store.buckets.update(bucket.id, {name: val});
          }}
        />
      </td>
      <td className="right">{balance_el}</td>
      {show_nodebt_balance ? <td className="right"><Money value={nodebt_balance} noanimate alwaysShowDecimal className="faint-cents" /></td> : null }
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
      <td className="right">
        <Money value={computed.deposit} hidezero />{computed.deposit ? <PerMonth/> : ''}
        {rainfall_indicator}
      </td>
      <td className="nopad bucket-details-wrap"><BucketKindDetails
          bucket={bucket}
          balance={balance}
          posting_date={posting_date} /></td>
      <td>
        <Link relative to={`/${bucket.id}`} className="subtle"><span className="fa fa-bar-chart"></span></Link>
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
      _.each(ev.dataTransfer.items, (item:any) => {
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
  rainfall: Balances;
  nodebt_balances: Balances;
  show_nodebt_balance: boolean;
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
    let { buckets, group, rainfall, balances, nodebt_balances, show_nodebt_balance, onPendingChanged, pending, posting_date } = this.props;
    pending = pending || {};
    let bucket_rows = _.sortBy(buckets || [], ['ranking'])
    .map(bucket => {
      return <BucketRow
        key={bucket.id}
        bucket={bucket}
        balance={balances[bucket.id]}
        rainfall={rainfall[bucket.id] || 0}
        nodebt_balance={nodebt_balances[bucket.id]}
        show_nodebt_balance={show_nodebt_balance}
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
      <tr className="group-row note-hover-trigger">
        <td className={cx(
          'nopad',
          'noborder', 
          {
            underDrag: this.state.underDrag,
            isDragging: this.state.isDragging,
            dropTopHalf: this.state.underDrag && this.state.dropHalf === 'top',
            dropBottomHalf: this.state.underDrag && this.state.dropHalf === 'bottom',
          })}>
          {group.id === NOGROUP ? null : <div
            className="drophandle"
            draggable={group.id !== NOGROUP}
            onDragStart={this.onDragStart}
            onDragEnd={this.onDragEnd}>
              <span className="fa fa-bars"/>
          </div>}
        </td>
        <td colSpan={100} className="group-name">
        {group.id === NOGROUP ? <span>{group.name} <Help>{sss('This is a special group for all the buckets without a group.')}</Help></span> : <ClickToEdit
          value={group.name}
          placeholder="no name"
          onChange={(val) => {
            manager.store.buckets.updateGroup(group.id, {name: val});
          }}
        />}
        {group.id === NOGROUP ? null : <NoteMaker obj={group} />}
        </td>
      </tr>
      <tr>
        <th className="nopad noborder"></th>
        <th>{sss('Bucket')}</th>
        <th className="right">{sss('Balance')}</th>
        {show_nodebt_balance ? <th className="right">{sss('Effective')} <Help><span>{sss('effective.help', 'This would be the balance if no buckets were in debt.')}</span></Help></th> : null}
        <th className="left">{sss('In/Out')}</th>
        <th className="right nobr"><span className="fa fa-tint"/> {sss('Rain')} <Help><span>{sss('bucketrain.help', 'This is how much money these buckets want each month.  The little box indicates how much they have received.')}</span></Help></th>
        <th>{sss('bucket.detailslabel', 'Details')}</th>
        <th></th>
      </tr>
      {bucket_rows}
      <tr className="action-row">
        <td colSpan={100} className="right"><button onClick={this.createBucket}>{sss('action.New bucket', 'New bucket')}</button></td>
      </tr>
    </tbody>);
  }
  createBucket = () => {
    manager.store.buckets.add({name: sss('default new bucket name', 'New Bucket'), group_id: this.props.group.id})
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
      _.each(ev.dataTransfer.items, (item:any) => {
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
  rainfall: Balances;
  nodebt_balances: Balances;
  show_nodebt_balance: boolean;
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
    let { balances, rainfall, nodebt_balances, show_nodebt_balance, pending, posting_date } = this.props;
    pending = pending || {};

    let group_elems = getGroupedBuckets(this.props.buckets, this.props.groups)
      .map((item:{group:Group, buckets:Bucket[]}) => {
        let { group, buckets } = item;
        return <GroupRow
          key={group.id}
          group={group}
          buckets={buckets}
          balances={balances}
          rainfall={rainfall}
          nodebt_balances={nodebt_balances}
          show_nodebt_balance={show_nodebt_balance}
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
      name: sss('misc group name', 'Misc'),
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
  rainfall: number;
  appstate: AppState;
  transactions: Transaction[];
}
export class BucketView extends React.Component<BucketViewProps, {}> {
  constructor(props) {
    super(props)
  }
  render() {
    let { bucket, balance, rainfall, transactions, appstate } = this.props;
    let kick_button;
    let kicked_ribbon;
    if (bucket.kicked) {
      kicked_ribbon = <div className="kicked-ribbon">{sss('single-bucket Kicked', 'Kicked')}</div>
      kick_button = <button
        onClick={() => {
          manager.store.buckets.unkick(bucket.id);
        }}>{sss('Un-kick')}</button>
    } else {
      kick_button = <button
        className="delete"
        onClick={() => {
          manager.store.buckets.kick(bucket.id)
          .then(new_bucket => {
            if (!new_bucket.kicked) {
              // it was deleted
              makeToast(sss('Bucket deleted completely'));
            }
          })
        }}>{sss('Kick the bucket')}</button>
    }

    let chart;
    chart = <BucketBalanceChart
      divProps={{
        style: {
          float: 'right',
          width: '50%',
          height: '10rem',
          padding: '1rem',
        }
      }}
      appstate={appstate}
      bucket_id={bucket.id}
    />

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
            {chart}
            <h1>
              <ColorPicker
              value={bucket.color}
              onChange={(val) => {
                manager.store.buckets.update(bucket.id, {color: val})
              }} />
              <ClickToEdit
                value={bucket.name}
                placeholder="no name"
                onChange={(val) => {
                  manager.store.buckets.update(bucket.id, {name: val});
                }}
              />
            </h1>
            <div>{sss('Balance:')} <Money value={balance} /></div>
            <div>{sss('Rainfall this month:')} <Money value={rainfall} /></div>
            <hr/>
            <TransactionList
              transactions={transactions}
              ending_balance={balance}
              appstate={appstate} />
          </div>
        </div>
      </div>)
  }
}


class TransactionList extends React.Component<{
  transactions: Transaction[];
  appstate: AppState;
  ending_balance: number;
}, {}> {
  render() {
    let { transactions, appstate, ending_balance } = this.props;
    let rows = transactions.map(trans => {
      let running_bal;
      if (!isNil(ending_balance)) {
        running_bal = ending_balance;
        ending_balance -= trans.amount;
      }
      let account_name;
      if (trans.account_trans_id) {
        let account_id = appstate.transactions[trans.account_trans_id].account_id;
        if (account_id) {
          account_name = appstate.accounts[account_id].name;
        }
      }
      return <tr key={trans.id} className="note-hover-trigger">
        <td className="nobr"><NoteMaker obj={trans} /><DateDisplay value={trans.posted} /></td>
        <td style={{width:'40%'}}>{trans.memo}</td>
        <td className="right"><Money value={trans.amount} /></td>
        {ending_balance === null ? null : <td className="right"><Money value={running_bal} /></td>}
        <td className="center">
          <input
            type="checkbox"
            checked={trans.transfer}
            onChange={(ev) => {
              manager.store.buckets.updateTransaction(trans.id, {
                transfer: ev.target.checked,
              })
            }}/>
        </td>
        <td>{account_name}</td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>{sss('Posted')}</th>
          <th>{sss('Memo')}</th>
          <th className="right">{sss('Amount')}</th>
          {ending_balance === null ? null : <th className="right">{sss('Balance')}</th> }
          <th className="nobr">{sss('noun.transfer', 'Transfer')} <Help>{sss('bucket.transfer.help', "A transfer is a transaction from one bucket to another.  If the transaction isn't income or an expense, it's likely a transfer.")}</Help></th>
          <th>{sss('Misc')}</th>
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