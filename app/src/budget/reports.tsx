import * as moment from 'moment'
import * as React from 'react'
import { manager, AppState } from './appstate'
import { Money, cents2decimal } from '../money'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { COLORS, opacity } from '../color'

import { chunkTime, IncomeExpenseSum } from '../models/reports'

export class ReportsPage extends React.Component<{
  appstate: AppState;
}, {}> {
  constructor(props) {
    super(props);
  }
  render() {
    let { appstate } = this.props;
    // let tickValues = [];
    // let max_y = 1000;
    // let max_bal = 1000;
    // let data = this.state.intervalsummary
    // .map((range, idx) => {
    //   let month = range.start.unix();
    //   tickValues.push(month);
    //   let net = range.income + range.expenses;
    //   max_y = Math.max(max_y, range.income, Math.abs(range.expenses))
    //   max_bal = Math.max(max_bal, range.end_balance);
    //   return {
    //     month: month,
    //     income: range.income,
    //     expenses: Math.abs(range.expenses),
    //     end_balance: range.end_balance,
    //     net,
    //   }
    // })
    let yearend = appstate.viewDateRange.before.clone().endOf('year');
    let multiyearstart = yearend.clone().subtract(4, 'years');
    
    return <div className="panes">
      <div className="padded">
        <CashFlowComparison
          start={multiyearstart}
          end={yearend}
        />
      </div>
    </div>
  }
}


interface CashFlowComparisonProps {
  start: moment.Moment;
  end: moment.Moment;
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
    let { start, end } = props;
    let summaries = await Promise.all(chunkTime({
      start: start,
      end: end,
      unit: 'year',
      step: 1,
    }).map(interval => {
      let year_begin = interval.start.clone().local().startOf('year');
      let year_end = year_begin.clone().add(1, 'year');
      return manager.store.reports.incomeAndExpenses({
        start: year_begin,
        end: year_end,
      })  
    }))
    this.setState({data: summaries});
  }
  render() {
    if (!this.state.data.length) {
      return null;
    }
    let min_val = null;
    let max_val = null;
    let min_bal = null;
    let max_bal = null;
    let min_net = null;
    let max_net = null;
    let years = this.state.data.map(item => {
      let this_min = Math.min(item.income, Math.abs(item.expenses));
      let this_max = Math.max(item.income, Math.abs(item.expenses));
      min_val = min_val === null ? this_min : Math.min(this_min, min_val);
      max_val = max_val === null ? this_max : Math.max(this_max, max_val);
      min_bal = min_bal === null ? item.end_balance : Math.min(item.end_balance, min_bal);
      max_bal = max_bal === null ? item.end_balance : Math.max(item.end_balance, max_bal);
      min_net = min_net === null ? item.income + item.expenses : Math.min(min_net, item.income + item.expenses);
      max_net = max_net === null ? item.income + item.expenses : Math.max(max_net, item.income + item.expenses);
      return item.interval.start.format('YYYY');
    });
    let complete_data = this.state.data.slice(0, this.state.data.length-1);
    return <table className="summary full-width" >
      <thead>
        <tr>
          <th></th>
          {years.map(year => <th key={year} className="center">{year}</th>)}
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


              let income_curve = income_area(this.state.data);
              let expense_curve = expense_area(this.state.data);

              return <svg preserveAspectRatio="xMidYMid meet" viewBox={`${-Math.floor(dims.width/(2*this.state.data.length))} 0 ${dims.width} ${dims.height}`}>
                <defs>
                  <path id="income-curve" d={income_curve} />
                  <path id="expense-curve" d={expense_curve} />
                </defs>

                <mask id="income-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <use xlinkHref="#expense-curve" fill="black" />
                </mask>
                <mask id="expense-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <use xlinkHref="#income-curve" fill="black" />
                </mask>
                <mask id="inner-curve">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <use
                    xlinkHref="#income-curve"
                    fill="black"
                    mask="url(#income-mask)"
                  />
                  <use
                    xlinkHref="#expense-curve"
                    fill="black"
                    mask="url(#expense-mask)"
                  />
                </mask>

                <g>
                  <line x1={0} y1={y(min_val)} x2={x(this.state.data.length-1)} y2={y(min_val)} stroke={COLORS.lighter_grey} strokeWidth={1} strokeDasharray="5, 5" />
                  <line x1={0} y1={y(max_val)} x2={x(this.state.data.length-1)} y2={y(max_val)} stroke={COLORS.lighter_grey} strokeWidth={1} strokeDasharray="5, 5" />

                  
                  <use
                    xlinkHref="#expense-curve"
                    fill={opacity(COLORS.red, 0.25)}
                    mask="url(#expense-mask)"
                  />
                  <use
                    xlinkHref="#income-curve"
                    fill={opacity(COLORS.green, 0.25)}
                    mask="url(#income-mask)"
                  />

                  <path d={expense_line(this.state.data)} fill="transparent" stroke={COLORS.red} strokeWidth={2} />
                  {expense_points.map((point, i) => {
                    return <g key={i}>
                      <circle
                        mask="url(#inner-curve)"
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
                        mask="url(#inner-curve)"
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
            <Money className="smallcents" value={(() => {
              let first = this.state.data[0];
              let last = this.state.data[this.state.data.length-1];
              return last.end_balance - first.end_balance;
            })()} />
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


export class SizeAwareDiv extends React.Component<{
  guts: (args:{width:number, height:number})=>JSX.Element;
  [x:string]: any;
}, {
  height: number;
  width: number;
}> {
  private elem:HTMLElement;
  constructor(props) {
    super(props);
    this.state = {
      height: 0,
      width: 0,
    }
  }
  recomputeState() {
    let bounds = d3.select(this.elem).node().getBoundingClientRect();
    this.setState({
      height: bounds.height || 0,
      width: bounds.width,
    })
  }
  componentDidMount() {
    this.recomputeState();
    window.addEventListener('resize', this.windowResized, false);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.windowResized);
  }
  windowResized = () => {
    this.recomputeState();
  }
  render() {
    let { guts, ...rest } = this.props;
    return <div ref={elem => this.elem = elem} {...rest}>
      {guts(this.state)}
    </div>
  }
}



// <section>
//           <h2>Balance</h2>
//           <V.VictoryChart
//               domain={{y: [0, max_bal * 1.25]}}
//               height={200}
//               width={800}
//             >
//               <V.VictoryAxis
//                 standalone={false}
//                 tickValues={tickValues}
//                 tickFormat={this.formatMonthLabel.bind(this)}
//                 style={{
//                   grid: {
//                     stroke: 'rgba(236, 240, 241,1.0)',
//                     strokeWidth: 2,
//                   }
//                 }}
//               />
//               <V.VictoryAxis
//                 dependentAxis
//                 tickFormat={x => cents2decimal(x)}
//                 style={{
//                   grid: {
//                     stroke: 'rgba(236, 240, 241,1.0)',
//                     strokeWidth: 2,
//                   }
//                 }}
//               />
//               <V.VictoryArea
//                 data={data}
//                 interpolation="catmullRom"
//                 style={
//                   {
//                     data: {
//                       stroke: COLORS.blue,
//                       fill: 'rgba(52, 152, 219, 0.2)',
//                     }
//                   }
//                 }
//                 x="month"
//                 y="end_balance" />
//           </V.VictoryChart>

//           <h2>Income/Expenses</h2>
//           <V.VictoryChart
//             domain={{y: [0, max_y * 1.25]}}
//             height={300}
//             width={800}
//           >
//             <V.VictoryAxis
//               standalone={false}
//               tickValues={tickValues}
//               tickFormat={this.formatMonthLabel.bind(this)}
//               style={{
//                 grid: {
//                   stroke: 'rgba(236, 240, 241,1.0)',
//                   strokeWidth: 2,
//                 }
//               }}
//             />
//             <V.VictoryAxis
//               dependentAxis
//               tickFormat={x => cents2decimal(x)}
//               style={{
//                 grid: {
//                   stroke: 'rgba(236, 240, 241,1.0)',
//                   strokeWidth: 2,
//                 }
//               }}
//             />
//             <V.VictoryArea
//               data={data}
//               interpolation="catmullRom"
//               style={
//                 {
//                   data: {
//                     // fill: 'rgba(46, 204, 113,0.1)',
//                     // fill: 'rgba(231, 76, 60, 0.1)',
//                     fill: '#ffffff',
//                   }
//                 }
//               }
//               x="month"
//               y={tick => {
//                 return tick.income;
//               }}
//               y0={(tick) => {
//                 return tick.expenses;
//               }}
//             />
//             <V.VictoryArea
//               data={data}
//               interpolation="catmullRom"
//               style={
//                 {
//                   data: {
//                     stroke: COLORS.red,
//                     fill: 'rgba(231, 76, 60, 0.4)',
//                   }
//                 }
//               }
//               x="month"
//               y="expenses" />
//             <V.VictoryArea
//               data={data}
//               interpolation="catmullRom"
//               style={
//                 {
//                   data: {
//                     stroke: COLORS.darker_green,
//                     fill: 'rgba(46, 204, 113,0.4)',
//                   }
//                 }
//               }
//               x="month"
//               y="income" />
            
//           </V.VictoryChart>

          
          
//         </section>