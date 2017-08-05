import * as React from 'react'
import * as moment from 'moment'
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
    let adate = appstate.viewDateRange.onOrAfter.clone().startOf('year');
    manager.store.reports.incomeAndExpenses({
      start: adate,
      end: adate.clone().add(1, 'year'),
    })
    .then(result => {
      console.log('result', result);
      this.setState({intervalsummary: result})
    })
  }
  componentWillReceiveProps(nextProps) {
    this.computeState(nextProps);
  }
  render() {
    let tickValues = [];
    let data = this.state.intervalsummary
    .map((range, idx) => {
      tickValues.push(range.start.format('MMM'));
      return {
        month: range.start.format('MMM'),
        income: range.income,
        expenses: Math.abs(range.expenses),
      }
    })
    return <div className="panes">
      <div className="padded">
        <section>
          <h2>Expenses</h2>
          <V.VictoryChart
            theme={V.VictoryTheme.material}
            height={200}
            width={600}
            domainPadding={80}
          >
            <V.VictoryAxis
              tickValues={tickValues}
              tickFormat={x => {
                console.log('x', x);
                return x
              }}
            />
            <V.VictoryAxis
              dependentAxis
              tickFormat={x => cents2decimal(x)}
            />
            <V.VictoryGroup
              offset={10}
              colorScale={[COLORS.red, COLORS.darker_green]}
            >
              <V.VictoryBar
                data={data}
                style={
                  {data: {fill: COLORS.red}}
                }
                x="month"
                y="expenses" />
              <V.VictoryBar
                data={data}
                className="income"
                style={
                  {data: {fill: COLORS.darker_green}}
                }
                x="month"
                y="income" />
            </V.VictoryGroup>
          </V.VictoryChart>
        </section>
      </div>
    </div>
  }
}