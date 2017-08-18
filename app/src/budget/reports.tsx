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

import { Help } from '../tooltip'
import { Link, Route, Switch, WithRouting } from './routing'
import { Transaction as ATrans } from '../models/account'
import { Bucket, computeBucketData } from '../models/bucket'
import { chunkTime, IncomeExpenseSum, Interval } from '../models/reports'
import { TransactionList } from './transactions'

import { SizeAwareDiv } from '../charts/util'

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
          <Route path="/buckets">
            <BucketExpenseSummary
              appstate={appstate}
            />
          </Route>
          <Route path="">
            <h2>Month to Month</h2>
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

            <h2>Year to Year</h2>
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
    manager.addListener('obj', this.processEvent)
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
    manager.removeListener('obj', this.processEvent);
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
          <th className="side">Income</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.income}/>
            </td>
          })}
          <th className="side-total">
            Avg: <Money className="smallcents" value={d3.mean(complete_data, item => item.income)} />
          </th>
        </tr>
        <tr className="hover">
          <th className="side">Expenses</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.expenses}/>
            </td>
          })}
          <th className="side-total">
            Avg: <Money className="smallcents" value={d3.mean(complete_data, item => item.expenses)} />
          </th>
        </tr>
        {net_transfer_total ? <tr className="hover">
          <th className="side">Net Transfers <Help>Net transfers are the sum total of all transactions marked as a transfer.  It should be 0.  If it's not, click through to make sure there aren't duplicate transactions or transactions miscategorized as transfers.</Help></th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              {item.net_transfer ? <Link relative to={`/transfers/${item.interval.start.format('YYYY')}`}><Money className=" smallcents" value={item.net_transfer}/></Link> : "-"}
            </td>
          })}
          <th className="side-total">
            Tot: <Money className="smallcents" value={net_transfer_total} />
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
          <th className="side">Gain/Loss</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.income + item.expenses}/>
            </td>
          })}
          <th className="side-total">
            Tot: <Money className="smallcents" value={gain_loss_total} />
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
          <th className="side">Ending Balance</th>
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


interface BucketExpenseSummaryProps {
  appstate: AppState;
}
class BucketExpenseSummary extends React.Component<BucketExpenseSummaryProps, any> {
  constructor(props) {
    super(props)
    this.state = {

    }
  }
  render() {
    let { appstate } = this.props;
    let end_date = appstate.viewDateRange.onOrAfter;
    let rows = appstate.unkicked_buckets
    .filter(bucket => {
      return bucket.kind === 'deposit';
    })
    .map(bucket => {
      return <BucketExpenseSummaryRow
        key={bucket.id}
        bucket={bucket}
        end_date={end_date}
        balance={appstate.bucket_balances[bucket.id]}
      />
    })
    return <div>
      <h2>Average Expenses</h2>
      <table className="summary full-width">
        <thead>
          <tr>
            <th className="left">Bucket</th>
            <th>Budgeted</th>
            <th>Prior 12 months</th>
            <th>Prior 3 months</th>
            <th>Last month</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  }
}

interface BucketExpenseSummaryRowProps {
  bucket: Bucket;
  end_date: moment.Moment;
  balance: number;
}
class BucketExpenseSummaryRow extends React.Component<BucketExpenseSummaryRowProps, {
  last12: number;
  last3: number;
  last: number;
}> {
  constructor(props) {
    super(props)
    this.state = {
      last12: null,
      last3: null,
      last: null,
    }
    this.recomputeState(props);
  }
  async recomputeState(props:BucketExpenseSummaryRowProps) {
    let { end_date } = props;
    let months = await Promise.all(chunkTime({
      start: end_date.clone().subtract(12, 'months'),
      end: end_date,
      unit: 'month',
      step: 1
    }).map(interval => {
      return manager.store.reports.bucketExpenses({
        bucket_id: props.bucket.id,
        start: interval.start,
        end: interval.end,
      })
    }));
    function getAvg(slice:number[]):number {
      return Math.ceil(slice.reduce((a,b)=> {
        return (a||0) + (b||0);
      }, 0) / slice.length);
    }

    let last12 = Math.abs(getAvg(months));
    let last3 = Math.abs(getAvg(months.slice(9)));
    let last = Math.abs(getAvg([months[months.length-1]]));
    this.setState({
      last12,
      last3,
      last,
    })
  }
  componentWillReceiveProps(nextProps) {
    this.recomputeState(nextProps);
  }
  render() {
    let { bucket, end_date, balance } = this.props;
    // let { last12, last3, last } = this.state;
    let computed = computeBucketData(bucket.kind, bucket, {
      today: end_date.clone().add(1, 'day'),
      balance: balance,
    })
    function makeComparison(amount) {
      if (amount === 0) {
        return '-';
      }
      return <Money value={amount} className={cx({
        bad: amount > computed.deposit,
        good: amount < computed.deposit,
      })} />
    }
    return <tr className="hover">
      <th className="side">{bucket.name}</th>
      <td className="center"><Money value={computed.deposit} /></td>
      <td className="center">{makeComparison(this.state.last12)}</td>
      <td className="center">{makeComparison(this.state.last3)}</td>
      <td className="center">{makeComparison(this.state.last)}</td>
    </tr>
  }
}

