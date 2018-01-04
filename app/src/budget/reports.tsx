import * as moment from 'moment'
import * as _ from 'lodash'
import * as React from 'react'
import * as cx from 'classnames'
import { manager, AppState } from './appstate'
import { ObjectEvent, isObj } from '../store'
import { Money } from '../money'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { COLORS, opacity } from '../color'
import { chunkTime, Interval } from '../time'

import { Help } from '../tooltip'
import { Link, Route, Switch, WithRouting } from './routing'
import { Transaction as ATrans } from '../models/account'
import { Bucket, computeBucketData } from '../models/bucket'
import { IncomeExpenseSum } from '../models/reports'
import { TransactionList } from './transactions'

import { SizeAwareDiv, UPARROW, DOWNARROW } from '../charts/util'
import { sss } from '../i18n'

export class ReportsPage extends React.Component<{
  appstate: AppState;
}, {}> {
  constructor(props) {
    super(props);
  }
  render() {
    let { appstate } = this.props;

    let year_end = appstate.viewDateRange.before.clone().endOf('year');
    let year_intervals = chunkTime({
      start: year_end.clone().subtract(4, 'years').startOf('year'),
      end: year_end,
      unit: 'year',
      step: 1,
    });

    let month_end = appstate.viewDateRange.before.clone().subtract(1, 'day');
    let month_intervals = chunkTime({
      start: month_end.clone().subtract(4, 'months').startOf('month'),
      end: month_end,
      unit: 'month',
      step: 1,
    })
    
    return <div className="panes">
      <div className="padded">
        <Switch>
          <Route path="/transfers/<int:txyear>">
            <WithRouting func={(routing) => {
              let start = moment({year: routing.params.txyear, month: 0, day: 1});
              let end = start.clone().add(1, 'year');
              return (<TransferTransactions
                appstate={appstate}
                start={start}
                end={end}
                />)
            }} />
          </Route>
          <Route path="/recurring-expenses">
            <BucketExpenseSummary
              appstate={appstate}
            />
          </Route>
          <Route path="">
            <h2 className="center">{sss('Month to Month')}</h2>
            <CashFlowComparison
              intervals={month_intervals}
              columnFormatter={(x:Interval, idx:number) => {
                if (idx === 0) {
                  return x.start.format('MMM YYYY');
                } else {
                  return x.start.format('MMM');
                }
              }}
            />

            <h2 className="center">{sss('Year to Year')}</h2>
            <CashFlowComparison
              intervals={year_intervals}
              columnFormatter={(x:Interval) => x.start.format('YYYY')}
            />
          </Route>
        </Switch>
      </div>
    </div>
  }
}

interface TransferTransactionsProps {
  start: moment.Moment;
  end: moment.Moment;
  appstate: AppState;
}
class TransferTransactions extends React.Component<TransferTransactionsProps, {
  transactions: ATrans[];
}> {
  constructor(props) {
    super(props);
    this.state = {
      transactions: [],
    }
    this.recomputeState(props);
    manager.events.obj.on(this.processEvent)
  }
  async recomputeState(props:TransferTransactionsProps) {
    let current = this.props;
    if (current.start.isSame(props.start) && current.end.isSame(props.end) && this.state.transactions.length) {
      // don't update
      return;
    }
    let { start, end } = props;
    let transactions = await manager.store.accounts.listTransactions({
      posted: {
        onOrAfter: start,
        before: end,
      },
      countedAsTransfer: true,
    })
    this.setState({transactions: transactions});
  }
  processEvent = (ev:ObjectEvent<any>) => {
    if (isObj(ATrans, ev.obj)) {
      for (let i = 0; i < this.state.transactions.length; i++) {
        let trans = this.state.transactions[i];
        if (trans.id === ev.obj.id) {
          let newtransactions = _.cloneDeep(this.state.transactions);
          newtransactions.splice(i, 1, ev.obj);
          this.setState({transactions: newtransactions})
          break;
        }
      }
    }
  }
  componentWillUnmount() {
    manager.events.obj.on(this.processEvent);
  }
  render() {
    return <TransactionList
      transactions={this.state.transactions}
      appstate={this.props.appstate}
      noCreate
    />
  }
}


interface CashFlowComparisonProps {
  intervals: Interval[];
  columnFormatter: (x:Interval, i?:number)=>string;
}
export class CashFlowComparison extends React.Component<CashFlowComparisonProps, {
  data: IncomeExpenseSum[];
}> {
  constructor(props) {
    super(props)
    this.state = {
      data: []
    }
    this.recomputeState(props);
  }
  componentWillReceiveProps(nextProps) {
    this.recomputeState(nextProps);
  }
  async recomputeState(props:CashFlowComparisonProps) {
    let { intervals } = props;
    let summaries = await Promise.all(intervals.map(interval => {
      return manager.store.reports.incomeAndExpenses({
        start: interval.start,
        end: interval.end,
      })  
    }))
    this.setState({data: summaries});
  }
  render() {
    if (!this.state.data.length) {
      return null;
    }
    let { columnFormatter } = this.props;
    let min_val = null;
    let max_val = null;
    let min_bal = null;
    let max_bal = null;
    let min_net = null;
    let max_net = null;
    let net_transfer_total = 0;
    let gain_loss_total = 0;
    let labels = this.state.data.map((item, idx) => {
      let this_min = Math.min(item.income, Math.abs(item.expenses));
      let this_max = Math.max(item.income, Math.abs(item.expenses));
      min_val = min_val === null ? this_min : Math.min(this_min, min_val);
      max_val = max_val === null ? this_max : Math.max(this_max, max_val);
      min_bal = min_bal === null ? item.end_balance : Math.min(item.end_balance, min_bal);
      max_bal = max_bal === null ? item.end_balance : Math.max(item.end_balance, max_bal);
      min_net = min_net === null ? item.income + item.expenses : Math.min(min_net, item.income + item.expenses);
      max_net = max_net === null ? item.income + item.expenses : Math.max(max_net, item.income + item.expenses);
      gain_loss_total += item.income + item.expenses;
      net_transfer_total += item.net_transfer;
      return columnFormatter(item.interval, idx);
    });
    let complete_data = this.state.data.slice(0, this.state.data.length-1);
    return <table className="summary full-width" >
      <thead>
        <tr>
          <th></th>
          {labels.map(label => <th key={label} className="center">{label}</th>)}
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr className="hover">
          <th className="side">{sss('Income')}</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.income}/>
            </td>
          })}
          <th className="side-total">
            {sss('Avg:')} <Money className="smallcents" value={d3.mean(complete_data, item => item.income)} />
          </th>
        </tr>
        <tr className="hover">
          <th className="side">{sss('Expenses')}</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.expenses}/>
            </td>
          })}
          <th className="side-total">
            {sss('Avg:')} <Money className="smallcents" value={d3.mean(complete_data, item => item.expenses)} />
          </th>
        </tr>
        {net_transfer_total ? <tr className="hover">
          <th className="side">{sss('Net Transfers')} <Help>{sss('net-transfers.help', "Net transfers are the sum total of all transactions marked as a transfer.  It should be 0.  If it's not, click through to make sure there aren't duplicate transactions or transactions miscategorized as transfers.")}</Help></th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              {item.net_transfer ? <Link relative to={`/transfers/${item.interval.start.format('YYYY')}`}><Money className=" smallcents" value={item.net_transfer}/></Link> : "-"}
            </td>
          })}
          <th className="side-total">
            {sss('Tot:')} <Money className="smallcents" value={net_transfer_total} />
          </th>
        </tr> : null }
        <tr>
          <th className="side"></th>
          <td colSpan={this.state.data.length}>
            <SizeAwareDiv style={{width: '100%', height: "4rem"}} guts={(dims) => {
              let x = d3.scaleLinear()
                .domain([0, this.state.data.length])
                .range([0, dims.width || 1]);
              let y = d3.scaleLinear()
                .domain([min_val, max_val])
                .range([dims.height-10, 10]);

              let income_line = d3shape.line<IncomeExpenseSum>()
                .x((d,i) => x(i))
                .y(d => y(d.income))
                .curve(d3shape.curveMonotoneX);
              let income_points = this.state.data.map((item, i) => {
                return {
                  x: x(i),
                  y: y(item.income),
                };
              })
              let income_area = d3shape.area<IncomeExpenseSum>()
                .x((d,i) => x(i))
                .y1(d => y(d.income))
                .y0(y(0))
                .curve(d3shape.curveMonotoneX);

              let expense_line = d3shape.line<IncomeExpenseSum>()
                .x((d,i) => x(i))
                .y(d => y(Math.abs(d.expenses)))
                .curve(d3shape.curveMonotoneX);
              let expense_points = this.state.data.map((item, i) => {
                return {
                  x: x(i),
                  y: y(Math.abs(item.expenses)),
                };
              })
              let expense_area = d3shape.area<IncomeExpenseSum>()
                .x((d,i) => x(i))
                .y1(d => y(Math.abs(d.expenses)))
                .y0(y(0))
                .curve(d3shape.curveMonotoneX);

              let randomID = Math.random().toString();
              let mkid = (x:string) => {
                return `${x}-${randomID}`;
              }

              let income_curve = income_area(this.state.data);
              let expense_curve = expense_area(this.state.data);

              return <svg preserveAspectRatio="xMidYMid meet" viewBox={`${-Math.floor(dims.width/(2*this.state.data.length))} 0 ${dims.width} ${dims.height}`}>
                <defs>
                  <path id={mkid("income-curve")} d={income_curve} />
                  <path id={mkid("expense-curve")} d={expense_curve} />
                </defs>

                <mask id={mkid("income-mask")}>
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <use xlinkHref={mkid("#expense-curve")} fill="black" />
                </mask>
                <mask id={mkid("expense-mask")}>
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <use xlinkHref={mkid("#income-curve")} fill="black" />
                </mask>
                <mask id={mkid("inner-curve")}>
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <use
                    xlinkHref={mkid("#income-curve")}
                    fill="black"
                    mask={`url(${mkid("#income-mask")})`}
                  />
                  <use
                    xlinkHref={mkid("#expense-curve")}
                    fill="black"
                    mask={`url(${mkid("#expense-mask")})`}
                  />
                </mask>

                <g>
                  <line x1={0} y1={y(min_val)} x2={x(this.state.data.length-1)} y2={y(min_val)} stroke={COLORS.lighter_grey} strokeWidth={1} strokeDasharray="5, 5" />
                  <line x1={0} y1={y(max_val)} x2={x(this.state.data.length-1)} y2={y(max_val)} stroke={COLORS.lighter_grey} strokeWidth={1} strokeDasharray="5, 5" />

                  
                  <use
                    xlinkHref={mkid("#expense-curve")}
                    fill={opacity(COLORS.red, 0.25)}
                    mask={`url(${mkid("#expense-mask")})`}
                  />
                  <use
                    xlinkHref={mkid("#income-curve")}
                    fill={opacity(COLORS.green, 0.25)}
                    mask={`url(${mkid("#income-mask")})`}
                  />

                  <path d={expense_line(this.state.data)} fill="transparent" stroke={COLORS.red} strokeWidth={2} />
                  {expense_points.map((point, i) => {
                    return <g key={i}>
                      <circle
                        mask={`url(${mkid("#inner-curve")})`}
                        r={3}
                        cx={point.x}
                        cy={point.y}
                        fill={COLORS.red} />
                      
                    </g>
                  })}

                  <path d={income_line(this.state.data)} fill="transparent" stroke={COLORS.green} strokeWidth={2} />
                  {income_points.map((point, i) => {
                    return <g key={i}>
                      <circle
                        mask={`url(${mkid("#inner-curve")})`}
                        r={3}
                        cx={point.x}
                        cy={point.y}
                        fill={COLORS.green} />
                    </g>
                  })}
                  
                </g>
              </svg>
            }} />
          </td>
          <th className="side-total">
          </th>
        </tr>
        <tr className="hover">
          <th className="side">{sss('Gain/Loss')}</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.income + item.expenses}/>
            </td>
          })}
          <th className="side-total">
            {sss('Tot:')} <Money className="smallcents" value={gain_loss_total} />
          </th>
        </tr>
        <tr>
          <th className="side"></th>
          <td colSpan={this.state.data.length}>
            <SizeAwareDiv style={{width: '100%', height: "4rem"}} guts={dims => {
              let barwidth = 16;
              let x = d3.scaleLinear()
                .domain([0, this.state.data.length])
                .range([0, dims.width]);
              let y = d3.scaleLinear()
                .domain([Math.min(min_net, 0), max_net])
                .range([dims.height-10, 10]);

              return <svg preserveAspectRatio="xMidYMid meet" viewBox={`${-Math.floor(dims.width/(2*this.state.data.length))} 0 ${dims.width} ${dims.height}`}>
                <line x1={-barwidth/2} y1={y(0)} x2={x(this.state.data.length-1)+barwidth/2} y2={y(0)} stroke={COLORS.lighter_grey} strokeWidth={1} />

                {max_net > 0 ? <line x1={-barwidth/2} y1={y(max_net)} x2={x(this.state.data.length-1)+barwidth/2} y2={y(max_net)} stroke={opacity(COLORS.green, 0.5)} strokeWidth={1} strokeDasharray="5, 5" /> : null}
                {min_net < 0 ? <line x1={-barwidth/2} y1={y(min_net)} x2={x(this.state.data.length-1)+barwidth/2} y2={y(min_net)} stroke={opacity(COLORS.red, 0.5)} strokeWidth={1} strokeDasharray="5, 5" /> : null}

                {this.state.data.map((item, i) => {
                  let net = item.income + item.expenses;
                  let ry = 0;
                  let height = net;
                  let color = COLORS.green;
                  if (net < 0) {
                    // negative
                    ry = 0;
                    height = Math.abs(net)
                    color = COLORS.red;
                  } else {
                    // positive
                    ry = net;

                  }
                  return <g key={i}>
                    <rect
                      width={barwidth}
                      height={Math.abs(y(height) - y(0))}
                      x={x(i)-barwidth/2}
                      y={y(ry)}
                      fill={color} />
                  </g>
                })}
              </svg>
            }}/>
          </td>
          <th className="side-total">
          </th>
        </tr>
        <tr className="hover">
          <th className="side">{sss('Ending Balance')}</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.end_balance}/>
            </td>
          })}
          <th className="side-total">
          </th>
        </tr>
        <tr>
          <th className="side"></th>
          <td colSpan={this.state.data.length}>
            <SizeAwareDiv style={{width: '100%', height: "6rem"}} guts={(dims) => {
              let x = d3.scaleLinear()
                .domain([0, this.state.data.length])
                .range([0, dims.width || 1]);
              let y = d3.scaleLinear()
                .domain([Math.min(min_bal, 0), max_bal])
                .range([dims.height-10, 10]);

              let balance_line = d3shape.line<IncomeExpenseSum>()
                .x((d,i) => x(i))
                .y(d => y(d.end_balance))
                .curve(d3shape.curveMonotoneX);
              let balance_points = this.state.data.map((item, i) => {
                return {
                  x: x(i),
                  y: y(item.end_balance),
                };
              })
              let balance_area = d3shape.area<IncomeExpenseSum>()
                .x((d,i) => x(i))
                .y1(d => y(d.end_balance))
                .y0(y(0))
                .curve(d3shape.curveMonotoneX);

              return <svg preserveAspectRatio="xMidYMid meet" viewBox={`${-Math.floor(dims.width/(2*this.state.data.length))} 0 ${dims.width} ${dims.height}`}>

                <g>
                  <line x1={0} y1={y(0)} x2={x(this.state.data.length-1)} y2={y(0)} stroke={COLORS.lighter_grey} strokeWidth={1} />
                  <line x1={0} y1={y(min_bal)} x2={x(this.state.data.length-1)} y2={y(min_bal)} stroke={COLORS.lighter_grey} strokeWidth={1} strokeDasharray="5, 5" />
                  <line x1={0} y1={y(max_bal)} x2={x(this.state.data.length-1)} y2={y(max_bal)} stroke={COLORS.lighter_grey} strokeWidth={1} strokeDasharray="5, 5" />

                  <path
                    d={balance_line(this.state.data)}
                    fill="transparent"
                    stroke={COLORS.blue}
                    strokeWidth={2} />
                  <path
                    d={balance_area(this.state.data)}
                    fill={opacity(COLORS.blue, 0.25)}
                    />
                  {balance_points.map((point, i) => {
                    return <g key={i}>
                      <circle r={3} cx={point.x} cy={point.y} fill={COLORS.blue} />
                    </g>
                  })}

                </g>
              </svg>
            }} />
          </td>
          <th className="side-total">
          </th>
        </tr>
      </tbody>
    </table>
  }
}


function logbase(x:number, base:number) {
  return Math.log(x) / Math.log(base);
}

interface BucketExpenseSummaryProps {
  appstate: AppState;
}
interface BucketExpenseSummaryState {
  data: {
    [key:number]: {
      interval: Interval;
      avg_expenses: number;
      min_expenses: number;
      max_expenses: number;
      deviation: number;
      last_month_expenses: number;
    },
  },
  segments: {
    [magnitude:number]: {
      min: number;
      max: number;
      buckets: Bucket[];
    }
  },
}
class BucketExpenseSummary extends React.Component<BucketExpenseSummaryProps, BucketExpenseSummaryState> {
  constructor(props) {
    super(props)
    this.state = {
      data: {},
      segments: {},
    }
    this.recomputeState(props);
  }
  async recomputeState(nextProps:BucketExpenseSummaryProps) {
    let { appstate } = nextProps;
    let end_date = appstate.viewDateRange.onOrAfter;
    let buckets = appstate.unkicked_buckets
    .filter(bucket => {
      return bucket.kind === 'deposit';
    })

    let data = {}
    let segments = {};

    await Promise.all(buckets.map(async bucket => {
      let history = await manager.store.reports.bucketExpenseHistory({
        end: end_date,
        bucket_id: bucket.id,
      });
      const balance = appstate.bucket_balances[bucket.id];
      let computed = computeBucketData(bucket.kind, bucket, {
        today: end_date.clone().add(1, 'day'),
        balance: balance,
      })
      if (!history) {
        data[bucket.id] = null;
        return;
      }
      let expenses = history.intervals
        .map(i => {
          if (i.expenses === null) {
            return 0;
          }
          return -i.expenses;
        });
      let avg_expenses = d3.sum(expenses) / expenses.length;
      let deviation = d3.deviation(expenses) || 0;
      let min_expenses = d3.min(expenses);
      let max_expenses = d3.max(expenses);

      let last_month_expenses = -(history.intervals.slice(-1)[0].expenses || 0);

      let magnitude = Math.floor(logbase(computed.deposit, 7));
      if (!segments[magnitude]) {
        segments[magnitude] = {
          buckets: [],
          min: avg_expenses,
          max: avg_expenses,
        }
      }
      let segment = segments[magnitude];
      segment.buckets.push(bucket);

      segment.min = Math.min(avg_expenses, last_month_expenses, segment.min);
      segment.max = Math.max(avg_expenses, last_month_expenses, segment.max);

      data[bucket.id] = {
        avg_expenses,
        deviation,
        min_expenses,
        max_expenses,
        last_month_expenses,
        interval: history.interval,
      }
    }))
    this.setState({
      segments,
      data,
    })
  }
  componentWillReceiveProps(nextProps) {
    this.recomputeState(nextProps);
  }
  render() {
    let { appstate } = this.props;
    let end_date = appstate.viewDateRange.onOrAfter;
    
    let sections = Object.keys(this.state.segments)
    .map(x=>Number(x))
    .sort((a,b) => a - b)
    .reverse()
    .map(magnitude => {
      let segment = this.state.segments[magnitude];
      let rows = segment.buckets.map((bucket, idx) => {
        return <BucketExpenseSummaryRow
          key={bucket.id}
          bucket={bucket}
          end_date={end_date}
          min={segment.min}
          max={segment.max}
          balance={appstate.bucket_balances[bucket.id]}
          data={this.state.data[bucket.id]}
        />
      })
      return <tbody key={magnitude} className="line-below">
        <tr className="divider">
          <th colSpan={100}>&nbsp;</th>
        </tr>
        {rows}
      </tbody>
    })
    return <div>
      <h2 className="center">{sss('Recurring Expenses')}</h2>
      <table className="summary full-width">
        <thead>
          <tr>
            <th className="right right-padded">{sss('Bucket')}</th>
            <th className="right right-padded">{sss('Budgeted')}</th>
            <th colSpan={2} className="right right-padded">{sss('Last month')}</th>
            <th colSpan={3} className="">{sss('Average')}
            &nbsp;<Help>
              <div>{sss('The center dot shows the budgeted amount per month.')}</div>
              <div>{sss('The end of the bar is the average amount you spent above or below the budgeted amount for the given period.')}</div>
            </Help></th>
            <th className="right right-padded">{sss('Period (months)')}</th>
          </tr>
        </thead>
        {sections}
        <tfoot>
          <tr>
            <th colSpan={100}></th>
          </tr>
        </tfoot>
      </table>
    </div>
  }
}

interface BucketExpenseSummaryRowProps {
  bucket: Bucket;
  end_date: moment.Moment;
  balance: number;
  min: number;
  max: number;
  data: {
    avg_expenses: number;
    min_expenses: number;
    max_expenses: number;
    deviation: number;
    last_month_expenses: number;
    interval: Interval;  
  }
}
class BucketExpenseSummaryRow extends React.Component<BucketExpenseSummaryRowProps, {}> {
  render() {
    let { bucket, end_date, balance, data, min, max } = this.props;
    let computed = computeBucketData(bucket.kind, bucket, {
      today: end_date.clone().add(1, 'day'),
      balance: balance,
    })
    let avg_over = data.avg_expenses - computed.deposit;
    let avg_overspend = avg_over > 0;
    let last_over = data.last_month_expenses - computed.deposit;
    let last_overspend = last_over > 0;

    function showAnalysis() {
      let blocks = [];
      let points = [];
      if (!data) {
        return <div></div>
      }
      // blocks.push({
      //   a: data.avg_expenses - data.deviation,
      //   b: data.avg_expenses + data.deviation,
      //   fill: 'var(--grey)',
      //   opacity: 0.5,
      //   h: 2,
      // })
      blocks.push({
        a: data.min_expenses,
        b: data.max_expenses,
        fill: 'var(--lighter-grey)',
        opacity: 0.5,
        h: 2,
      })
      // if (avg_overspend) {
      //   blocks.push({
      //     a: computed.deposit,
      //     b: data.avg_expenses,
      //     fill: 'var(--red)',
      //     opacity: 1,
      //     h: 4,
      //   })
      // } else {
      //   blocks.push({
      //     a: data.avg_expenses,
      //     b: computed.deposit,
      //     fill: 'var(--green)',
      //     opacity: 1,
      //     h: 4,
      //   })
      // }
      points.push({
        value: computed.deposit,
        fill: 'var(--darker-darkblue)',
      });
      
      points.push({
        value: data.avg_expenses,
        stroke: avg_overspend ? 'var(--red)' : 'var(--green)',
        fill: 'white',
        strokeWidth: 2,
      })

      
      console.log('last_month_expenses', data.last_month_expenses);
      if (data.last_month_expenses) {
        points.push({
          value: data.last_month_expenses,
          fill: last_overspend ? 'var(--red)' : 'var(--green)',
        })
      }

      
      
      return <div>
        <NumberlineChart
          width={400}
          height={15}
          min={min}
          max={max}
          center={computed.deposit}
          points={points}
          blocks={blocks}
        />
        
      </div>
    }
    return <tr className="hover">
      <th className="right-border">{bucket.name}</th>
      <td className="right-border"><Money value={computed.deposit} /></td>
      <td className="right left-padded"><Money value={data.last_month_expenses} round /></td>
      <td className={cx("nobr incdeclabel right-border left-padded", {
        bad: last_overspend,
      })}>{last_overspend ? UPARROW : DOWNARROW}<Money value={Math.abs(last_over)} round /></td>

      <td className="right left-padded"><Money value={data.avg_expenses} round /></td>
      <td className={cx("nobr incdeclabel right left-padded", {
        bad: avg_overspend,
      })}>{avg_overspend ? UPARROW : DOWNARROW}<Money value={Math.abs(avg_over)} round /></td>
      <td className="right-border center">{showAnalysis()}</td>
      <td className="right-border">{data.interval ? data.interval.end.diff(data.interval.start, 'months') : ''}</td>
    </tr>
  }
}


interface NumberlineChartProps {
  height?: number;
  width?: number;
  center?: number;
  min?: number;
  max?: number;
  className?: string;
  points?: Array<{
    value: number;
    symbol?: 'tick' | 'circle';
    className?: string;
    r?: number;
    label?: string;
    label_options?: {
      [k:string]: any;
    };
    [k:string]: any;
  }>;
  blocks?: Array<{
    a: number;
    b: number;
    className?: string;
    h?: number;
    [k:string]: any;
  }>;
}
class NumberlineChart extends React.Component<NumberlineChartProps, {}> {
  render() {
    let { height, width, center, points, blocks, className, min, max } = this.props;
    const radius = 4;
    const hpadding = 30;
    height = height || 6;
    width = width || 150;
    points = points || [];
    blocks = blocks || [];

    min = min === undefined ? points[0].value : min;
    max = max === undefined ? points[0].value : max;
    points.forEach(point => {
      min = Math.min(min, point.value);
      max = Math.max(max, point.value);
    })
    blocks.forEach(block => {
      min = Math.min(min, block.a, block.b);
      max = Math.max(max, block.a, block.b);
    })

    if (center) {
      let r = Math.max(Math.abs(center - min), Math.abs(center - max));
      min = center - r;
      max = center + r;
    }
    const x = d3.scaleLinear()
      .domain([min, max])
      .range([hpadding, width-hpadding]);
    const y = height / 2;

    return <div
      className={cx("numberline", className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}>
      <svg viewBox={`0 0 ${width} ${height}`}>
        {blocks.map((block, idx) => {
          let { a, b, className, h, ...rest } = block;
          if (b < a) {
            let tmp = a;
            a = b;
            b = tmp;
          }
          let w = x(b) - x(a);
          h = h || 4;
          return <rect
            key={idx}
            x={x(a)}
            rx={2}
            ry={2}
            width={w}
            y={height/2-h/2}
            height={h}
            className={className}
            {...rest}
          />
        })}
        {points.map((point, idx) => {
          let { symbol, value, className, r, label, label_options, ...rest } = point;
          let elem;
          if (symbol === 'tick') {
            elem = <line
              key={idx}
              x1={x(value)}
              x2={x(value)}
              y1={0}
              y2={height}
              className={className}
              {...rest}
            />
          } else {
            elem = <circle
              key={idx}
              cx={x(value)}
              cy={y}
              r={r === undefined ? radius : r}
              className={className}
              {...rest}
            />
          }
          if (label) {
            let { textAnchor } = label_options;
            return <g key={idx}>
              {elem}
              <text
                x={x(value)}
                y={0}
                dy={12}
                fontSize={12}
                textAnchor={textAnchor}
                {...label_options}
              >{label}</text>
            </g>
          } else {
            return elem;
          }
        })}
      </svg>
    </div>
  }
}
