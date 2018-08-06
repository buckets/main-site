import * as moment from 'moment-timezone'
import * as React from 'react'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { manager, AppState } from '../appstate'
import { Balances } from 'buckets-core/dist/models/balances'
import { DateDisplay } from '../../time'
import { Money } from '../../money'
import { sss } from '../../i18n'

import { COLORS } from 'buckets-core/dist/color'
import { SizeAwareDiv } from '../../charts/util'


interface BalanceHistory {
  date: moment.Moment,
  balances: Balances,
}
interface NetWealthProps {
  appstate: AppState;
}
interface NetWealthState {
  fetched_date: moment.Moment;
  fetched: boolean;
  monthly_history: BalanceHistory[];
  yearly_history: BalanceHistory[];
}
export class NetWealthPage extends React.Component<NetWealthProps, NetWealthState> {
  state = {
    fetched_date: null,
    fetched: false,
    monthly_history: null,
    yearly_history: null,
  }

  static getDerivedStateFromProps(props:NetWealthProps, state:NetWealthState) {
    if (props.appstate.viewDateRange.before !== state.fetched_date) {
      return {
        // monthly_history: null,
        // yearly_history: null,
        fetched: false,
        fetched_date: props.appstate.viewDateRange.before,
      }
    }
    return null;
  }
  componentDidMount() {
    this.recomputeData();
  }
  componentDidUpdate(prevProps, prevState) {
    if (!this.state.fetched) {
      this.recomputeData();
    }
  }
  async recomputeData() {
    const NUM_MONTHS = 6;
    const NUM_YEARS = 6;
    const earliest = await manager.nocheckpoint.sub.reports.earliestTransaction();
    const end_date = this.props.appstate.viewDateRange.onOrAfter.clone().endOf('month');

    let month_start = end_date.clone().subtract(NUM_MONTHS, 'months');
    if (month_start.isBefore(earliest)) {
      month_start = earliest.clone().startOf('month');
    }
    let year_start = end_date.clone().subtract(NUM_YEARS, 'years');
    if (year_start.isBefore(earliest)) {
      year_start = earliest.clone().startOf('year');
    }
    let months = [];
    while (month_start.isSameOrBefore(end_date)) {
      months.push(month_start.clone().endOf('month'))
      month_start.add(1, 'month');
    }
    let years = [];
    while (year_start.isSameOrBefore(end_date)) {
      years.push(year_start.clone().endOf('year'))
      year_start.add(1, 'year');
    }
    let monthly_history = await manager.nocheckpoint.sub.reports.debtAndWealth({
      dates: months,
    })
    let yearly_history = await manager.nocheckpoint.sub.reports.debtAndWealth({
      dates: years,
    })
    this.setState({
      fetched: true,
      monthly_history,
      yearly_history,
    })
  }
  render() {
    if (this.state.monthly_history === null) {
      return <div><span className="fa fa-refresh fa-fw fa-spin"/></div>
    }
    return <div>
      {this.state.yearly_history.length > 1
      ? <div>
          <h2>{sss('Yearly')}</h2>
          {netWealthTable(this.state.yearly_history, 'YYYY')}
        </div>
      : null
      }
      <h2>{sss('Monthly')}</h2>
      {netWealthTable(this.state.monthly_history, 'MMM', 'MMM YYYY')}
    </div>
  }
}

function netWealthChart(history:BalanceHistory[]) {
  let min_val = null;
  let max_val = null;
  let debt_totals = {};
  let wealth_totals = {};
  let totals = {};
  const bar_spacing = 2;
  const max_bar_width = 20;
  history.forEach((item, i) => {
    wealth_totals[i] = 0;
    debt_totals[i] = 0;
    totals[i] = 0;
    Object.values(item.balances).forEach(bal => {
      if (bal > 0) {
        wealth_totals[i] += bal;
      } else {
        debt_totals[i] += bal;
      }
      totals[i] += bal;
    })
    min_val = d3.min<number>([wealth_totals[i], Math.abs(debt_totals[i]), totals[i], min_val || 0]);
    max_val = d3.max<number>([wealth_totals[i], Math.abs(debt_totals[i]), totals[i], max_val || 0]);
  })
  return <SizeAwareDiv
    style={{width: '100%', height: "10rem"}}
    guts={(dims) => {
      const unit_width = dims.width / history.length;
      let bar_width = (unit_width - bar_spacing) / 2;
      bar_width = bar_width > max_bar_width ? max_bar_width : bar_width;
      bar_width = bar_width < 0 ? 2 : bar_width;
      let middle = bar_width + bar_spacing / 2;

      let x = d3.scaleLinear()
        .domain([0, history.length])
        .range([0, dims.width || 1]);
      let y = d3.scaleLinear()
        .domain([min_val, max_val])
        .range([dims.height-10, 10]);
      function bar_ydims(val):{
        height: number,
        y: number,
      } {
        let ry = 0;
        let height = val;
        if (val < 0) {
          // negative
          ry = 0;
          height = Math.abs(val);
        } else {
          // positive
          ry = val;
        }
        return {
          height: Math.abs(y(height) - y(0)),
          y: y(ry),
        }
      }

      // netwealth line
      let netwealth_line = d3shape.line<number>()
        .x((d,i) => x(i) + unit_width-(2*bar_width)-bar_spacing+middle)
        .y((d,i) => y(d))
        .curve(d3shape.curveMonotoneX);

      return <svg
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${dims.width} ${dims.height}`}>
        <line
          x1={0}
          x2={dims.width}
          y1={y(0)}
          y2={y(0)}
          stroke={COLORS.lighter_grey}
        />

        <path
          d={netwealth_line(Object.values(totals))}
          fill="transparent"
          stroke={COLORS.grey}
          strokeWidth={2}
          strokeDasharray={"5, 5"}
        />
        {history.map((item, i) => {
          const xshift = x(i) + unit_width - (2*bar_width) - bar_spacing;
          return <g key={i} transform={`translate(${xshift}, 0)`}>
            <circle
              cx={middle}
              cy={y(totals[i])}
              r={3}
              fill={COLORS.grey}
            />
            <rect
              x={0}
              width={bar_width}
              {...bar_ydims(Math.abs(debt_totals[i]))}
              fill={COLORS.red}
            />
            <rect
              x={bar_spacing + bar_width}
              width={bar_width}
              {...bar_ydims(wealth_totals[i])}
              fill={COLORS.green}
            />
          </g>
        })}
      </svg>
    }}
  />
}

function netWealthTable(history:BalanceHistory[], datefmt:string, lastdatefmt:string=datefmt) {
  let debt_totals = {};
  let wealth_totals = {};
  let totals = {};
  history.forEach((item, i) => {
    wealth_totals[i] = 0;
    debt_totals[i] = 0;
    totals[i] = 0;
    Object.values(item.balances).forEach(bal => {
      if (bal > 0) {
        wealth_totals[i] += bal;
      } else {
        debt_totals[i] += bal;
      }
      totals[i] += bal;
    })
  })
  return <table className="ledger full-width">
    <thead>
      <tr>
        <td></td>
        <td colSpan={history.length}>
          {netWealthChart(history)}
        </td>
      </tr>
      <tr>
        <th></th>
        {history.map((item, i) => {
          return <th className="right" key={i}><DateDisplay value={item.date} format={i === (history.length-1) ? lastdatefmt : datefmt} islocal /></th>
        })}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{sss('Assets')}</td>
        {history.map((item, i) => {
          return <td className="right" key={i}><Money value={wealth_totals[i]} nocolor /></td>
        })}
      </tr>
      <tr>
        <td>{sss('Debt')}</td>
        {history.map((item, i) => {
          return <td className="right" key={i}><Money value={debt_totals[i]} nocolor /></td>
        })}
      </tr>
      <tr>
        <td>{sss('Net Wealth')}</td>
        {history.map((item, i) => {
          return <td className="right" key={i}><Money value={totals[i]} colorPositive /></td>
        })}
      </tr>
    </tbody>
  </table>
}