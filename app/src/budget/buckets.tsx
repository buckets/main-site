import * as React from 'react'
import * as _ from 'lodash'
import * as cx from 'classnames'
import * as moment from 'moment-timezone'
import { Switch, Route, Link, WithRouting, Redirect } from './routing'
import { Bucket, BucketKind, Group, Transaction, computeBucketData, BucketFlow, BucketFlowMap, emptyFlow } from '../models/bucket'
import { ts2utcdb, DateDisplay, parseUTCTime, localNow, makeLocalDate, PerMonth } from '../time'
import {Balances} from '../models/balances'
import { Money, MoneyInput, cents2decimal } from '../money'
import { onKeys, MonthSelector, ClickToEdit, SafetySwitch, DebouncedInput } from '../input'
import { manager, AppState } from './appstate'
import { ColorPicker } from '../color'
import { makeToast } from './toast'
import { pageY } from '../position'
import { Help } from '../tooltip'
import { BucketBalanceChart } from '../charts/balancechart'
import { sss } from '../i18n'
import { isNil, isDifferent } from '../util'
import { NoteMaker } from './notes'
import { parseLocalTime } from '../time'
import { createTemplateBucketSet } from './gettingstarted'

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
            manager
            .checkpoint(sss('Un-kick Bucket'))
            .buckets.unkick(bucket.id);
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
        <div className="value"><Money value={to_deposit} symbol/></div>
      </div>);
    }
    if (to_withdraw) {
      pendingInfo.push(<div key="withdraw" className="labeled-number">
        <div className="label">{sss('Out')}</div>
        <div className="value"><Money value={to_withdraw} symbol /></div>
      </div>)
    }
    if (to_deposit && to_withdraw) {
      let amount;
      if (to_deposit + to_withdraw) {
        amount = <Money value={to_deposit + to_withdraw} symbol />
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
        <div className="value"><Money value={appstate.rain - (to_deposit + to_withdraw)} symbol nocolor /></div>
      </div>;
    }

    let doPendingButton;
    let warning;
    if (to_deposit || to_withdraw) {
      const total = to_deposit + to_withdraw;
      if (total > 0 && total > appstate.rain) {
        doPendingButton = <SafetySwitch
          onClick={this.doPending}
        >{sss('Make it so')}</SafetySwitch>
        warning = <Help className="right" icon={<span className="error fa fa-exclamation-triangle" />}>{sss("Warning: Doing this will use rain you don't have and could steal rain from future months (if available).")}</Help>
      } else {
        doPendingButton = <button className="primary" onClick={this.doPending}>{sss('Make it so')}</button>;  
      }
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
    if (self_debt_amount) {
      self_debt = <div className="labeled-number">
        <div className="label">
          {sss('Self debt')} <Help>{sss('Amount of money over-allocated in buckets.')}</Help>
        </div>
        <div className="value"><Money value={self_debt_amount} /></div>
      </div>
    }

    let getting_started;
    if (appstate.unkicked_buckets.length < 3) {
      getting_started = <div className="notice">
        {sss('Need ideas for getting started?')} <button
          onClick={createTemplateBucketSet}
        >{sss('Start with a template')}</button>
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
            let rainfall = appstate.getBucketFlow(bucket.id).in;
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
                  <div className="value"><Money value={total_rain_needed} /></div>
                </div>
                {self_debt}
              </div>
              <div className="group">
                {rainleft}
                {pendingInfo}
                {warning}
                {doPendingButton}
              </div>
            </div>
            {getting_started}
            <div className="single-pane">
              
                <GroupedBucketList
                  buckets={appstate.unkicked_buckets}
                  balances={appstate.bucket_balances}
                  bucket_flow={appstate.bucket_flow}
                  groups={_.values(appstate.groups)}
                  onPendingChanged={this.pendingChanged}
                  pending={pending}
                  posting_date={appstate.defaultPostingDate} />
              
            </div>
          </div>
        </Route>
      </Switch>);
  }
  addBucket = () => {
    manager
    .checkpoint(sss('New Bucket'))
    .buckets.add({name: sss('default new bucket name', 'New Bucket')})
  }
  addGroup = () => {
    manager
    .checkpoint(sss('New Group'))
    .buckets.addGroup({name: sss('default new group name', 'New Group')})
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
        let rainfall = appstate.getBucketFlow(bucket.id).in;
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
    const store = manager.checkpoint(sss('Transactions'));
    _.map(this.state.pending, (amount, bucket_id) => {
      return store.buckets.transact({
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

class ProgressBubble extends React.PureComponent<{
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
        overfilled: percent > 100,
      })}
      style={outerStyle}>
      <div
        className="bubble-fill"
        style={innerStyle}></div>
    </div>
  }
}

class ProgressBar extends React.PureComponent<{
  percent:number;
  color?:string;
  width?:string;
  label?: string;
},{}> {
  render() {
    let { percent, color, width, label } = this.props;
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
    return <div className="progress-bar-wrap">
      <div className={cx("progress-bar", {
          overhalf: percent >= 50,
          complete: percent >= 100,
        })} style={outerStyle}>
        <div className="bar" style={innerStyle}>
          <div className="percent-label">{percent}%</div>
        </div>
      </div>
      <div className="text-label">{label}</div>
    </div>
  }
}

class BucketKindDetails extends React.Component<{
  bucket: Bucket;
  balance: number;
  posting_date: moment.Moment;
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
        <DebouncedInput
          value={bucket.goal}
          element={MoneyInput}
          changeArgIsValue
          onChange={val => {
            manager
            .checkpoint(sss('Update Goal'))
            .buckets.update(bucket.id, {goal: val});
          }}
        />
      </td>
    </tr>
  }
  targetDateRow() {
    let { bucket } = this.props;
    let dt = parseUTCTime(bucket.end_date);
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
            manager
            .checkpoint(sss('Update Target Date'))
            .buckets.update(bucket.id, {end_date: ts2utcdb(new_date)})
          }} />
      </td>
    </tr>
  }
  depositRow() {
    let { bucket } = this.props;
    return <tr key="deposit">
      <td>{sss('Monthly deposit:')}</td>
      <td>
        <DebouncedInput
          changeArgIsValue
          element={MoneyInput}
          value={bucket.deposit}
          onChange={val => {
            manager
            .checkpoint(sss('Update Monthly Deposit'))
            .buckets.update(bucket.id, {deposit: val})
          }} /><PerMonth/>
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
              manager
              .checkpoint(sss('Update Bucket Type'))
              .buckets.update(bucket.id, {kind: ev.target.value as BucketKind});
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
        let label_parts = [cents2decimal(computed.goal)];
        if (computed.end_date && computed.end_date.isValid()) {
          label_parts.push(computed.end_date.format('MMM YYYY'))
        }

        summary = <div className="goal-summary">
          <ProgressBar
            percent={percent}
            color={bucket.color} 
            label={label_parts.join(' - ')}
          />
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
  flow: BucketFlow;
  posting_date: moment.Moment;
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
      await manager
      .checkpoint(sss('Transaction'))
      .buckets.transact({
        bucket_id: bucket.id,
        amount: pending,
        posted: posting_date,
      })
      onPendingChanged({[bucket.id]: 0});
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return isDifferent(nextState, this.state) || isDifferent(nextProps, this.props);
  }
  render() {
    let { posting_date, bucket, balance, flow, onPendingChanged, pending } = this.props;
    let balance_el = <div className={cx("changing-value", {
      changing: pending,
    })}>
      <div className="old-value"><Money value={balance} /></div>
      {pending ? <div className="new-value"><Money value={balance + pending} /></div> : null}
    </div>
    let computed = computeBucketData(bucket.kind, bucket, {
      today: posting_date,
      balance: balance,
    })

    let rainfall_indicator;
    if (computed.deposit) {
      let percent = flow.in/computed.deposit*100;
      rainfall_indicator = <Help
        icon={<ProgressBubble height="1rem" percent={percent} />}>
        {Math.floor(percent)}%
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
      <td name="draghandle" className="nopad">
        <div
          className="drophandle"
          draggable
          onDragStart={this.onDragStart}
          onDragEnd={this.onDragEnd}>
            <span className="fa fa-bars"/>
        </div>
      </td>
      <td name="color/note" className="nobr right">
        <ColorPicker
          className="small"
          value={bucket.color}
          onChange={(val) => {
            manager.checkpoint(sss('Update Color'))
            .buckets.update(bucket.id, {color: val})
          }} />
        <NoteMaker
          obj={bucket}
        />
      </td>
      <td name="name" className="nobr">
        <ClickToEdit
          value={bucket.name}
          placeholder="no name"
          onChange={(val) => {
            manager
            .checkpoint(sss('Update Bucket Name'))
            .buckets.update(bucket.id, {name: val});
          }}
        />
      </td>
      <td name="balance" className="right clickable"
        onClick={ev => {
          onPendingChanged({[bucket.id]: -balance})
        }}
      >{balance_el}</td>
      <td name="in/out" className="left">
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
      <td name="want" className="right">
        <Money value={computed.deposit} hidezero />
        {rainfall_indicator}
      </td>
      <td name="in" className="right">
        <Money value={flow.in} hidezero />
      </td>
      <td name="activity" className="right">
        <Money value={flow.out + flow.transfer_in + flow.transfer_out} nocolor hidezero />
      </td>
      <td name="details"
          className="nopad bucket-details-wrap">
            <BucketKindDetails
            bucket={bucket}
            balance={balance}
            posting_date={posting_date} /></td>
      <td name="more">
        <Link relative to={`/${bucket.id}`} className="subtle"><span className="fa fa-ellipsis-h"></span></Link>
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
          manager
          .checkpoint(sss('Move Bucket'))
          .buckets.moveBucket(bucket_id, placement, this.props.bucket.id)
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
  bucket_flow: BucketFlowMap;
  posting_date: moment.Moment;
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
    let { buckets, group, bucket_flow, balances, onPendingChanged, pending, posting_date } = this.props;
    pending = pending || {};

    let total_in = 0;
    let total_out = 0;
    let total_transfer = 0;
    let total_balance = 0;

    let bucket_rows = _.sortBy(buckets || [], ['ranking'])
    .map(bucket => {
      let flow = bucket_flow[bucket.id] || Object.assign({}, emptyFlow)
      total_in += flow.in;
      total_out += flow.out;
      total_balance += balances[bucket.id];
      return <BucketRow
        key={bucket.id}
        bucket={bucket}
        balance={balances[bucket.id]}
        flow={flow}
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
      <tr className="section-divider">
          <th name="draghandle"></th>
          <th name="color/note"></th>
          <th name="name"></th>
          <th name="balance" className="right">{sss('Balance')}</th>
          <th name="in/out" className="center"><Help icon={sss('In/Out')}><span>{sss('bucketinout.help', 'Use this to put money in and take money out of each bucket.')}</span></Help></th>
          <th name="want" className="right nobr"><Help icon={sss('Want')}><span>{sss('bucketrain.help', 'This is how much money these buckets want each month.  The little box indicates how much they have received.')}</span></Help></th>
          <th name="in" className="center nobr"><Help icon={sss("In")}><span>{sss('buckethead.in', 'Amount of money put in this month.')}</span></Help></th>
          <th name="activity" className="center nobr"><Help icon={sss("Activity")}><span>{sss('bucketactivity.help', 'This is the sum of money taken out of this bucket and transfers in from other buckets this month.')}</span></Help></th>
          <th name="details">{sss('bucket.detailslabel', 'Details')}</th>
          <th name="more"></th>
        </tr>
      <tr className="group-row note-hover-trigger">
        <td name="draghandle"
          className={cx(
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
        <td name="color/note" className="right">
          <button
            className="icon"
            title={sss("New bucket")}
            onClick={this.createBucket}><span className="fa fa-plus" /></button>
          {group.id === NOGROUP ? null : <NoteMaker obj={group} />}
        </td>
        <td name="name" className="group-name">
          {group.id === NOGROUP ? <span>{group.name} <Help>{sss('This is a special group for all the buckets without a group.')}</Help></span> : <ClickToEdit
            value={group.name}
            placeholder="no name"
            onChange={(val) => {
              manager
              .checkpoint(sss('Update Group Name'))
              .buckets.updateGroup(group.id, {name: val});
            }}
          />}
        </td>
        <td name="balance" className="right">
          <Money value={total_balance} hidezero />
        </td>
        <td name="in/out"></td>
        <td name="want" className="right">
        </td>
        <td name="in" className="right">
          <Money value={total_in} hidezero/>
        </td>
        <td name="activity" className="right">
          <Money value={total_out + total_transfer} nocolor hidezero/>
        </td>
        <td name="details">
        </td>
        <td name="more">
          <SafetySwitch
            className="icon grey show-on-row-hover"
            onClick={ev => {
              manager
              .checkpoint(sss('Delete Group'))
              .buckets.deleteGroup(group.id);
            }}
          >
            <span className="fa fa-trash" />
          </SafetySwitch>
        </td>
      </tr>
      {bucket_rows}
    </tbody>);
  }
  createBucket = () => {
    manager
    .checkpoint(sss('New Bucket'))
    .buckets.add({name: sss('default new bucket name', 'New Bucket'), group_id: this.props.group.id})
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
            manager
            .checkpoint(sss('Move Group'))
            .buckets.moveGroup(group_id, placement, this.props.group.id);
          }
        } else if (item.type === 'bucket') {
          let bucket_id = ev.dataTransfer.getData(item.type);
          manager
          .checkpoint(sss('Move Bucket'))
          .buckets.update(bucket_id, {group_id: this.props.group.id})
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
  bucket_flow: BucketFlowMap;
  posting_date: moment.Moment;
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
    let { balances, bucket_flow, pending, posting_date } = this.props;
    pending = pending || {};

    let group_elems = getGroupedBuckets(this.props.buckets, this.props.groups)
      .map((item:{group:Group, buckets:Bucket[]}) => {
        let { group, buckets } = item;
        return <GroupRow
          key={group.id}
          group={group}
          buckets={buckets}
          balances={balances}
          bucket_flow={bucket_flow}
          onPendingChanged={this.pendingChanged}
          pending={pending}
          posting_date={posting_date} />
      })
    return <table className="ledger full-width">
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
          manager
          .checkpoint(sss('Un-kick Bucket'))
          .buckets.unkick(bucket.id);
        }}>{sss('Un-kick')}</button>
    } else {
      kick_button = <button
        className="delete"
        onClick={() => {
          manager
          .checkpoint(sss('Kick Bucket'))
          .buckets.kick(bucket.id)
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
                manager
                .checkpoint(sss('Update Color'))
                .buckets.update(bucket.id, {color: val})
              }} />
              <ClickToEdit
                value={bucket.name}
                placeholder="no name"
                onChange={(val) => {
                  manager
                  .checkpoint(sss('Update Name'))
                  .buckets.update(bucket.id, {name: val});
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


interface TransactionListProps {
  transactions: Transaction[];
  appstate: AppState;
  ending_balance: number;
}
interface TransactionListState {
  selected: Set<number>;
}
class TransactionList extends React.Component<TransactionListProps, TransactionListState> {
  constructor(props:TransactionListProps) {
    super(props);
    this.state = {
      selected: new Set<number>(),
    }
  }
  render() {
    let { transactions, appstate, ending_balance } = this.props;
    const sortFunc = [
      (item:Transaction) => -parseLocalTime(item.posted).unix(),
      'bucket_id',
      (item:Transaction) => -item.id]
    let rows = _.sortBy(transactions, sortFunc).map(trans => {
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
        <td>
          <input
            type="checkbox"
            checked={this.state.selected.has(trans.id)}
            onChange={ev => {
              let newset = new Set(this.state.selected);
              if (ev.target.checked) {
                newset.add(trans.id)
              } else {
                newset.delete(trans.id);
              }
              this.setState({selected: newset})
            }}/>
        </td>
        <td className="nobr"><NoteMaker obj={trans} /><DateDisplay value={trans.posted} islocal /></td>
        <td style={{width:'40%'}}>{trans.memo}</td>
        <td className="right"><Money value={trans.amount} /></td>
        {ending_balance === null ? null : <td className="right"><Money value={running_bal} /></td>}
        <td className="center">
          <input
            type="checkbox"
            checked={trans.transfer}
            onChange={(ev) => {
              manager
              .checkpoint(ev.target.checked ? sss('Make Transfer') : sss('Not Transfer'))
              .buckets.updateTransaction(trans.id, {
                transfer: ev.target.checked,
              })
            }}/>
        </td>
        <td>{account_name}</td>
      </tr>
    })

    let delete_count;
    if (this.state.selected.size) {
      delete_count = this.state.selected.size;
    }

    return <table className="ledger">
      <thead className="actions">
        <tr>
          <td colSpan={100}>
            <SafetySwitch
              disabled={!this.state.selected.size}
              onClick={ev => {
                manager
                .checkpoint(sss('Delete Transactions'))
                .buckets.deleteTransactions(Array.from(this.state.selected));
                this.setState({selected: new Set<number>()})
              }}
            >
              <span><span className="fa fa-trash" /> {delete_count}</span>
            </SafetySwitch>
          </td>
        </tr>
      </thead>
      <thead>
        <tr>
          <th></th>
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