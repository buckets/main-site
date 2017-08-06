import * as React from 'react'
import { manager, AppState } from './appstate'
import * as V from 'victory'

import { cents2decimal } from '../money'
import { IntervalSummary } from '../models/reports'
import { COLORS } from '../color'


export class ReportsPage extends React.Component<{
  appstate: AppState;
}, {
  intervalsummary: IntervalSummary[];
}> {
  constructor(props) {
    super(props);
    this.state = {
      intervalsummary: [],
    }
    this.computeState(props);
  }
  computeState(props) {
    let appstate:AppState = props.appstate;
    let adate = appstate.viewDateRange.before.clone();
    manager.store.reports.incomeAndExpenses({
      start: adate.clone().subtract(12, 'months'),
      end: adate,
    })
    .then(result => {
      this.setState({intervalsummary: result})
    })
  }
  componentWillReceiveProps(nextProps) {
    this.computeState(nextProps);
  }
  render() {
    let tickValues = [];
    let max_y = 1000;
    let max_bal = 1000;
    let data = this.state.intervalsummary
    .map((range, idx) => {
      tickValues.push(range.start.format('MMM'));
      let net = range.income + range.expenses;
      max_y = Math.max(max_y, range.income, Math.abs(range.expenses))
      max_bal = Math.max(max_bal, range.end_balance);
      return {
        month: range.start.format('MMM'),
        income: range.income,
        expenses: Math.abs(range.expenses),
        end_balance: range.end_balance,
        net,
      }
    })
    return <div className="panes">
      <div className="padded">
        <section>
          <V.VictoryChart
              domain={{y: [0, max_bal * 1.25]}}
              height={200}
              width={800}
            >
              <V.VictoryAxis
                standalone={false}
                tickValues={tickValues}
                tickFormat={x => {
                  return x;
                }}
                style={{
                  grid: {
                    stroke: 'rgba(236, 240, 241,1.0)',
                    strokeWidth: 2,
                  }
                }}
              />
              <V.VictoryAxis
                dependentAxis
                tickFormat={x => cents2decimal(x)}
                style={{
                  grid: {
                    stroke: 'rgba(236, 240, 241,1.0)',
                    strokeWidth: 2,
                  }
                }}
              />
              <V.VictoryArea
                data={data}
                interpolation="catmullRom"
                style={
                  {
                    data: {
                      stroke: COLORS.blue,
                      fill: 'rgba(52, 152, 219, 0.2)',
                    }
                  }
                }
                x="month"
                y="end_balance" />
          </V.VictoryChart>


          <V.VictoryChart
            domain={{y: [0, max_y * 1.25]}}
            height={300}
            width={800}
          >
            <V.VictoryAxis
              standalone={false}
              tickValues={tickValues}
              tickFormat={x => {
                return x;
              }}
              style={{
                grid: {
                  stroke: 'rgba(236, 240, 241,1.0)',
                  strokeWidth: 2,
                }
              }}
            />
            <V.VictoryAxis
              dependentAxis
              tickFormat={x => cents2decimal(x)}
              style={{
                grid: {
                  stroke: 'rgba(236, 240, 241,1.0)',
                  strokeWidth: 2,
                }
              }}
            />
            <V.VictoryArea
              data={data}
              interpolation="catmullRom"
              style={
                {
                  data: {
                    // fill: 'rgba(46, 204, 113,0.1)',
                    // fill: 'rgba(231, 76, 60, 0.1)',
                    fill: '#ffffff',
                  }
                }
              }
              x="month"
              y={tick => {
                return tick.income;
              }}
              y0={(tick) => {
                console.log('y0 tick', tick);
                return tick.expenses;
              }}
            />
            <V.VictoryArea
              data={data}
              interpolation="catmullRom"
              style={
                {
                  data: {
                    stroke: COLORS.red,
                    fill: 'rgba(231, 76, 60, 0.4)',
                  }
                }
              }
              x="month"
              y="expenses" />
            <V.VictoryArea
              data={data}
              interpolation="catmullRom"
              style={
                {
                  data: {
                    stroke: COLORS.darker_green,
                    fill: 'rgba(46, 204, 113,0.4)',
                  }
                }
              }
              x="month"
              y="income" />
            
          </V.VictoryChart>
          
        </section>
      </div>
    </div>
  }
}