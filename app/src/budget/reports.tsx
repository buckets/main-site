import * as moment from 'moment'
import * as React from 'react'
import { manager, AppState } from './appstate'
import { Money } from '../money'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { COLORS } from '../color'

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
      let year_begin = interval.start.clone().startOf('year');
      let year_end = year_begin.clone().add(1, 'year');
      return manager.store.reports.incomeAndExpenses({
        start: year_begin,
        end: year_end,
      })  
    }))
    this.setState({data: summaries});
  }
  render() {
    let min_val = null;
    let max_val = null;
    let years = this.state.data.map(item => {
      let this_min = Math.min(item.income, Math.abs(item.expenses));
      let this_max = Math.max(item.income, Math.abs(item.expenses));
      min_val = min_val === null ? this_min : Math.min(this_min, min_val);
      max_val = max_val === null ? this_max : Math.max(this_max, max_val);
      return item.interval.start.format('YYYY');
    });
    console.log('years', years);
    return <table className="ledger full-width" >
      <thead>
        <tr>
          <th></th>
          {years.map(year => <th key={year} className="center">{year}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>Income</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.income}/>
            </td>
          })}
        </tr>
        <tr>
          <th>Expenses</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.expenses}/>
            </td>
          })}
        </tr>
        <tr>
          <td></td>
          <td colSpan={this.state.data.length}>
            <SizeAwareDiv style={{width: '100%', height: "4rem"}} guts={(dims) => {
              console.log('sizeAwareDiv', dims);
              let x = d3.scaleLinear()
                .domain([0, this.state.data.length])
                .range([0, dims.width]);
              // let diff = max_val - min_val;
              // let padding = diff * 0.1;
              let y = d3.scaleLinear()
                .domain([min_val, max_val])
                .range([dims.height-10, 10]);

              let income_line = d3shape.line<IncomeExpenseSum>()
                .x((d,i) => x(i))
                .y(d => y(d.income))
                .curve(d3shape.curveCatmullRom);
              let income_points = this.state.data.map((item, i) => {
                return {
                  x: x(i),
                  y: y(item.income),
                };
              })

              let expense_line = d3shape.line<IncomeExpenseSum>()
                .x((d,i) => x(i))
                .y(d => y(Math.abs(d.expenses)))
                .curve(d3shape.curveCatmullRom);
              let expense_points = this.state.data.map((item, i) => {
                return {
                  x: x(i),
                  y: y(Math.abs(item.expenses)),
                };
              })
              return <svg preserveAspectRatio="xMidYMid meet" viewBox={`${-Math.floor(dims.width/(2*this.state.data.length))} 0 ${dims.width} ${dims.height}`}>
                <g>
                  <line x1={0} y1={y(min_val)} x2={x(this.state.data.length-1)} y2={y(min_val)} stroke={COLORS.lighter_grey} strokeWidth={1} strokeDasharray="5, 5" />
                  <line x1={0} y1={y(max_val)} x2={x(this.state.data.length-1)} y2={y(max_val)} stroke={COLORS.lighter_grey} strokeWidth={1} strokeDasharray="5, 5" />

                  <path d={income_line(this.state.data)} fill="transparent" stroke={COLORS.green} strokeWidth={2} />
                  {income_points.map((point, i) => {
                    return <g key={i}>
                      <circle r={3} cx={point.x} cy={point.y} fill={COLORS.green} />
                      
                    </g>
                  })}
                  <path d={expense_line(this.state.data)} fill="transparent" stroke={COLORS.red} strokeWidth={2} />
                  {expense_points.map((point, i) => {
                    return <g key={i}>
                      <circle r={3} cx={point.x} cy={point.y} fill={COLORS.red} />
                      
                    </g>
                  })}
                </g>
              </svg>
            }} />
          </td>
        </tr>
        <tr>
          <th>Gain/Loss</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.income + item.expenses}/>
            </td>
          })}
        </tr>
        <tr>
          <th>Ending Balance</th>
          {this.state.data.map((item, i) => {
            return <td key={i} className="center">
              <Money className=" smallcents" value={item.end_balance}/>
            </td>
          })}
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
      height: bounds.height,
      width: bounds.width,
    })
  }
  componentDidMount() {
    this.recomputeState();
    window.addEventListener('resize', this.windowResized, false);
  }
  componentDidUnmount() {
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