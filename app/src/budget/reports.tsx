import * as moment from 'moment-timezone'
import * as _ from 'lodash'
import * as React from 'react'
import { manager, AppState } from './appstate'
import { ObjectEvent, isObj } from '../store'
import { Money, cents2decimal } from '../money'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { COLORS, opacity } from '../color'
import { chunkTime, Interval } from '../time'

import { debounceChange } from '../input'
import { Help } from '../tooltip'
import { Link, Route, Switch, WithRouting } from './routing'
import { Transaction as ATrans } from '../models/account'
import { Bucket, computeBucketData } from '../models/bucket'
import { IncomeExpenseSum } from '../models/reports'
import { TransactionList } from './transactions'

import { SizeAwareDiv } from '../charts/util'
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
              columnFormatter={(x:Interval) => x.start.format('MMM')}
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
    let transactions = await manager.nocheckpoint.sub.accounts.listTransactions({
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
      categories={this.props.appstate.categories}
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
      return manager.nocheckpoint.sub.reports.incomeAndExpenses({
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
                .domain([Math.min(min_bal), max_bal])
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
  expensesByBucket: {
    [key:number]: number[];
  },
  segments: {
    [magnitude:number]: number[];
  },
  timeback_number: number;
  timeback_unit: 'month'|'year';
}
class BucketExpenseSummary extends React.Component<BucketExpenseSummaryProps, BucketExpenseSummaryState> {
  constructor(props:BucketExpenseSummaryProps) {
    super(props)
    this.state = {
      expensesByBucket: {},
      segments: {},
      timeback_number: props.appstate.settings.reports_timeback_number || 18,
      timeback_unit: props.appstate.settings.reports_timeback_unit || 'month',
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
    
    let unit = this.state.timeback_unit;
    let start = end_date.clone()
      .startOf(unit)
      .add(1, unit)
      .subtract(this.state.timeback_number + (unit === 'month' ? 1 : 0), unit);
    let expensesByBucket = await manager.nocheckpoint.sub.reports.bucketExpenseHistories({
      interval: {
        start,
        end: end_date,
      },
      unit: this.state.timeback_unit,
      bucket_ids: buckets.map(x => x.id),
    })

    // Figure out where this bucket fits magnitude-wise
    let segments = {};
    buckets.forEach(bucket => {
      const balance = appstate.bucket_balances[bucket.id];
      const computed = computeBucketData(bucket.kind, bucket, {
        today: end_date.clone().add(1, 'day'),
        balance: balance,
      })

      let magnitude = Math.floor(logbase(computed.deposit, 10));
      if (!segments[magnitude]) {
        segments[magnitude] = [];
      }
      segments[magnitude].push(bucket.id);
    })
    this.setState({
      segments,
      expensesByBucket,
    })
  }
  componentWillReceiveProps(nextProps) {
    this.recomputeState(nextProps);
  }
  triggerReload = debounceChange(() => {
    this.recomputeState(this.props);
  })
  render() {
    let { appstate } = this.props;
    let end_date = appstate.viewDateRange.onOrAfter;
    let showing_years = this.state.timeback_unit === 'year';

    let sections = (Object.keys(this.state.segments)
      .map(x=>Number(x))
      .sort((a,b) => a - b)
      .reverse()
      .map(magnitude => {
        let segment = this.state.segments[magnitude];
        let rows = segment.map((bucket_id, idx) => {
          return <BucketExpenseSummaryRow
            key={bucket_id}
            bucket={appstate.buckets[bucket_id]}
            end_date={end_date}
            balance={appstate.bucket_balances[bucket_id]}
            expenses={this.state.expensesByBucket[bucket_id]}
          />
        })
        return <tbody key={`${magnitude}`} className="line-below">
          {rows}
        </tbody>
      }));
    if (sections.length) {
      return <div>
        <h2>{sss('Recurring Expenses')}</h2>
        <table className="summary full-width">
          <thead>
            <tr>
              <th className="right right-padded">{sss('Bucket')}</th>
              <th className="center">{sss('Budgeted')}</th>
              <th className="center">{sss('Average')}</th>
              <th className="left left-padded full-width">
                <input
                  type="range"
                  min="2"
                  max={showing_years ? 20 : 36}
                  value={this.state.timeback_number}
                  onChange={ev => {
                    let value = Number(ev.target.value);
                    this.setState({
                      timeback_number: value,
                    }, () => {
                      manager.nocheckpoint.sub.settings.updateSettings({
                        reports_timeback_number: this.state.timeback_number,
                      });
                      this.triggerReload();
                    })
                  }}
                />
                <span>{this.state.timeback_number}&nbsp;</span>

                <select
                  defaultValue={this.state.timeback_unit}
                  onChange={ev => {
                    let timeback_number = this.state.timeback_number;
                    if (ev.target.value === 'year' && this.state.timeback_unit === 'month') {
                      // switching from month -> year
                      timeback_number = 5;
                    }
                    this.setState({
                      timeback_unit: ev.target.value as any,
                      timeback_number: timeback_number,
                    }, () => {
                      manager.nocheckpoint.sub.settings.updateSettings({
                        reports_timeback_number: this.state.timeback_number,
                        reports_timeback_unit: this.state.timeback_unit,
                      })
                      this.triggerReload();
                    })
                  }}>
                  <option value="month">{sss('Months')}</option>
                  <option value="year">{sss('Years')}</option>
                </select>
              </th>
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
    } else {
      return <div>{sss("You don't have any recurring expense buckets yet.")}</div>
    }
  }
}


interface BucketExpenseSummaryRowProps {
  bucket: Bucket;
  end_date: moment.Moment;
  balance: number;
  expenses: number[];
}
class BucketExpenseSummaryRow extends React.Component<BucketExpenseSummaryRowProps, {}> {
  render() {
    let { bucket, end_date, balance, expenses } = this.props;
    let computed = computeBucketData(bucket.kind, bucket, {
      today: end_date.clone().add(1, 'day'),
      balance: balance,
    })

    let average = d3.sum(expenses) / expenses.length;
    
    return <tr className="hover">
      <th className="right-border">{bucket.name}</th>
      <td className="right-border"><Money value={computed.deposit} /></td>
      <td className="right-border"><Money value={Math.abs(average)} hidezero /></td>
      <td className="right-border center novpadding">
        <ExpenseChart
          minWidth={100}
          expected={computed.deposit}
          expenses={expenses.map(x => {
            return {amount: x}
          })}
          barsToShow={expenses.length}
        />
      </td>
    </tr>
  }
}

interface ExpenseChartProps {
  width?: number;
  minWidth?: number;
  height?: number;
  className?: string;
  expected: number;
  barsToShow?: number;
  barWidth?: number;
  barSpacing?: number;

  // Expense data with most recent time period first
  expenses: Array<{
    label?: string;
    amount: number;
  }>
}

class ExpenseChart extends React.PureComponent<ExpenseChartProps, {}> {
  render() {
    let { width, minWidth, height, barsToShow, barWidth, barSpacing, expenses, expected, className } = this.props;
    height = height || 30;
    const padding = 3;
    const vpadding = 1;
    const label_height = 12;
    const label_size = 10;
    // barsToShow = barsToShow || 12;

    barSpacing = barSpacing || 4;
    barWidth = barWidth || 10;
    width = width || (barsToShow * (barSpacing + barWidth) + barSpacing);

    //Math.floor(width / barsToShow - barSpacing);

    const expenses_list = expenses.map(item => {
      return Math.abs(item.amount);
    }).reverse().slice(0, barsToShow)
    const numBars = expenses_list.length;

    let maxy = d3.max(expenses_list)
    let miny = 0;
    maxy = Math.max(Math.max(0, maxy), expected)

    let x = d3.scaleLinear()
      .domain([0, barsToShow])
      .range([padding, width-padding]);
    let y = d3.scaleLinear()
      .domain([miny, maxy])
      .range([height-vpadding, vpadding+label_height]);

    const viewWidth = width < minWidth ? minWidth : width;

    return <div
      className={className}
      style={{
        width: `${viewWidth}px`,
        height: `${height}px`,
      }}>
      <svg viewBox={`0 0 ${viewWidth} ${height}`}>

        {expenses_list.map((expenses, i) => {
          let rects = [];
          let xval = x(numBars - i) - barWidth;
          rects.push(<rect
            key="hover-target"
            x={xval}
            width={barWidth}
            y={y(maxy)}
            height={height}
            fill="transparent"
          />)
          if (expenses > expected) {
            // overspend
            rects.push(<rect
              key="under"
              className="highlight"
              width={barWidth}
              x={xval}
              y={y(expected)}
              height={y(0) - y(expected)}
              fill={COLORS.lighter_grey}
            />)
            rects.push(<rect
              key="over"
              className="highlight"
              width={barWidth}
              x={xval}
              y={y(expenses)}
              height={y(expected) - y(expenses)}
              fill={COLORS.red}
            />)
          } else if (expenses) {
            // underspend
            rects.push(<rect
              className="highlight"
              key="under"
              width={barWidth}
              x={xval}
              y={y(expenses)}
              height={y(0) - y(expenses)}
              fill={COLORS.lighter_grey}
            />)
          }
          const lefthalf = xval < viewWidth/2;
          rects.push(<text
            key="label"
            x={
              lefthalf ? xval : xval + barWidth
            }
            textAnchor={
              lefthalf ? 'start' : 'end'
            }
            y={y(maxy)}
            dy={-2}
            fontSize={label_size}
           className="label"
          >{cents2decimal(expenses)}</text>)
          return <g key={i} className="hover-labels">
            {rects}
          </g>
        })}

        <line
          x1={padding}
          x2={width-padding}
          y1={y(0)}
          y2={y(0)}
          stroke={COLORS.lightest_grey} />
          />
      </svg>
    </div>

  }
}

