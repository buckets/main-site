import * as React from 'react'
import * as moment from 'moment'
import { manager, AppState } from './appstate'
import * as V from 'victory'

import { cents2decimal } from '../money'
import { IntervalSummary } from '../models/reports'


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
    manager.store.reports.incomeAndExpenses({
      start: moment.utc().startOf('year'),
      end: moment.utc().startOf('year').add(1, 'year'),
    })
    .then(result => {
      console.log('result', result);
      this.setState({intervalsummary: result})
    })
  }
  render() {
    let data = this.state.intervalsummary
    .map((range, idx) => {
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
            />
            <V.VictoryAxis
              dependentAxis
              tickFormat={x => cents2decimal(x)}
            />
            <V.VictoryGroup
              offset={10}
              colorScale={"warm"}
            >
              <V.VictoryBar
                style={{fill:"rgba(231, 76, 60,1.0)"}}
                data={data}
                x="month"
                y="expenses" />
              <V.VictoryBar
                data={data}
                x="month"
                y="income" />
            </V.VictoryGroup>
          </V.VictoryChart>
        </section>
      </div>
    </div>
  }
}