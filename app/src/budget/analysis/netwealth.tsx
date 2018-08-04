import * as moment from 'moment-timezone'
import * as React from 'react'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { manager, AppState } from '../appstate'
import { Balances } from 'buckets-core/dist/models/balances'
import { chunkTime } from 'buckets-core/dist/time'
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
  monthly_history: BalanceHistory[];
  yearly_history: BalanceHistory[];
}
export class NetWealthPage extends React.Component<NetWealthProps, NetWealthState> {
  state = {
    fetched_date: null,
    monthly_history: null,
    yearly_history: null,
  }

  static getDerivedStateFromProps(props:NetWealthProps, state:NetWealthState) {
    if (props.appstate.viewDateRange.before !== state.fetched_date) {
      return {
        monthly_history: null,
        yearly_history: null,
        fetched_date: props.appstate.viewDateRange.before,
      }
    }
    return null;
  }
  componentDidMount() {
    this.recomputeData();
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.monthly_history === null || this.state.yearly_history === null) {
      this.recomputeData();
    }
  }
  async recomputeData() {
    const end_date = this.props.appstate.viewDateRange.before.clone();
    const month_start = end_date.clone().subtract(6, 'months');
    const year_start = end_date.clone().subtract(5, 'years');
    let months = chunkTime({
      start: month_start,
      end: end_date,
      unit: 'month',
      step: 1,
    }).map(x => x.end);
    let years = chunkTime({
      start: year_start,
      end: end_date,
      unit: 'year',
      step: 1,
    }).map(x => x.end);
    let monthly_history = await manager.nocheckpoint.sub.reports.debtAndWealth({
      dates: months,
    })
    let yearly_history = await manager.nocheckpoint.sub.reports.debtAndWealth({
      dates: years,
    })
    this.setState({
      monthly_history,
      yearly_history,
    })
  }
  render() {
    if (this.state.monthly_history === null) {
      return <div>loading...</div>
    }
    return <div>
      <h2>{sss('Yearly')}</h2>
      {netWealthTable(this.state.yearly_history, 'YYYY')}
      <h2>{sss('Monthly')}</h2>
      {netWealthTable(this.state.monthly_history, 'MMM YYYY')}
    </div>
  }
}

function netWealthChart(history:BalanceHistory[], datefmt:string) {
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

function netWealthTable(history:BalanceHistory[], datefmt:string) {
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
          {netWealthChart(history, datefmt)}
        </td>
      </tr>
      <tr>
        <th></th>
        {history.map((item, i) => {
          return <th className="right" key={i}><DateDisplay value={item.date} format={datefmt} /></th>
        })}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{sss('Wealth')}</td>
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