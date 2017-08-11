import * as React from 'react'
import * as moment from 'moment'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { SizeAwareDiv, CHART_STYLES } from './util'
import { AppState, manager } from '../budget/appstate'
import { ensureUTCMoment } from '../time'
import { COLORS } from '../color'
import { computeBucketData } from '../models/bucket'
import { cents2decimal } from '../money'

interface BucketGoalChartProps {
  appstate: AppState;
  bucket_ids: number[];
  divProps?: object;
}
export class BucketGoalChart extends React.Component<BucketGoalChartProps, {
  balance_histories: {
    bucket_id: number;
    history: {
      time: moment.Moment;
      balance: number;  
    }[];
  }[];
}> {
  constructor(props) {
    super(props);
    this.state = {
      balance_histories: [],
    }
    this.recomputeState(props);
  }
  async recomputeState(props:BucketGoalChartProps) {
    let promises = props.bucket_ids.map(async bucket_id => {
      let rows = await manager.store.query(`
        SELECT
          amount,
          posted
        FROM
          bucket_transaction
        WHERE
          bucket_id=$bucket_id
        ORDER BY
          posted DESC`, {
        $bucket_id: bucket_id,
      })
      let balance = props.appstate.bucket_balances[bucket_id];
      let history = rows.map(row => {
        let ret = {
          time: ensureUTCMoment(row.posted),
          balance: balance
        }
        balance -= row.amount;
        return ret;
      })
      history.reverse();
      return {bucket_id, history}
    })
    let histories = await Promise.all(promises);
    this.setState({balance_histories: histories});
  }
  render() {
    let { divProps, appstate, bucket_ids } = this.props;
    let computed = {};

    let max_goal = 0;
    let max_enddate = 0;

    bucket_ids.forEach(bucket_id => {
      let bucket = appstate.buckets[bucket_id];
      let c = computed[bucket_id] = computeBucketData(bucket.kind, bucket, {
        today: moment.utc(),
        balance: bucket.balance,
      })
      max_goal = Math.max(c.goal, max_goal);
      if (c.end_date !== null && !isNaN(c.end_date)) {
        max_enddate = Math.max(c.end_date.unix(), max_enddate);  
      }
    })
    
    return <SizeAwareDiv {...divProps}
      guts={dims => {
        if (!this.state.balance_histories.length) {
          return null;
        }

        let min_bal = 0;
        let max_bal = 0;

        let min_time = null;
        let max_time = max_enddate;

        let axis_size = 20;
        
        this.state.balance_histories.forEach(balance_history => {
          balance_history.history.forEach(datapoint => {
            let time = datapoint.time.unix();
            min_time = min_time === null ? time : Math.min(time, min_time);
            max_time = Math.max(time, max_time);
            min_bal = Math.min(datapoint.balance, min_bal);
            max_bal = Math.max(datapoint.balance, max_bal);
          })
        })

        let max_y = Math.max(max_bal, max_goal);
        let min_y = min_bal;

        let x = d3.scaleLinear()
          .domain([min_time, max_time])
          .range([axis_size, dims.width ? dims.width - axis_size : 11]);
        let y = d3.scaleLinear()
          .domain([min_y, max_y])
          .range([dims.height-axis_size, axis_size]);

        let balance_line = d3.line<any>()
          .x(d => x(d.time.unix()))
          .y(d => y(d.balance))
          .curve(d3shape.curveMonotoneX);

        return <svg
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${dims.width} ${dims.height}`}>

          <line
            x1={x(min_time)}
            x2={x(max_time)}
            y1={y(0)}
            y2={y(0)}
            {...CHART_STYLES.axis}
          />
          <line
            x1={axis_size}
            x2={axis_size}
            y1={y(min_y)}
            y2={y(max_y)}
            {...CHART_STYLES.axis}
          />

          {this.state.balance_histories.map(({history, bucket_id}) => {
            if (!history.length) {
              return null;
            }
            let last_datapoint = history[history.length-1];
            let last_x = x(last_datapoint.time.unix());
            let last_y = y(last_datapoint.balance);
            let last_circle = (<g>

                <circle
                  r={5}
                  fill={appstate.buckets[bucket_id].color}
                  cx={last_x}
                  cy={last_y}
                />
                <text
                  x={last_x}
                  y={last_y}
                  dx={0}
                  dy={-10}
                  textAnchor="end">
                  {cents2decimal(last_datapoint.balance, false)}
                </text>
                <text
                  x={last_x}
                  y={last_y}
                  dx={0}
                  dy={-25}
                  textAnchor="end">
                  {last_datapoint.time.format('MMM YYYY')}
                </text>
              </g>)
            let forecast_line;
            let goal_circle;
            if (computed[bucket_id].end_date !== null && !isNaN(computed[bucket_id].end_date)) {
              let goal_x = x(computed[bucket_id].end_date.unix());
              let goal_y = y(computed[bucket_id].goal)

              forecast_line = (<line
                x1={x(last_datapoint.time.unix())}
                x2={goal_x}
                y1={y(last_datapoint.balance)}
                y2={goal_y}
                stroke={COLORS.lighter_grey}
                strokeWidth={1}
                strokeDasharray="5, 5"
                />)
              goal_circle = (<g>
                <circle
                  r={5}
                  fill={appstate.buckets[bucket_id].color}
                  cx={goal_x}
                  cy={goal_y}
                />
                <circle
                  r={3}
                  fill='white'
                  cx={goal_x}
                  cy={goal_y}
                />
                <text
                  x={goal_x}
                  y={goal_y}
                  dx={0}
                  dy={35}
                  textAnchor="end">
                  {cents2decimal(computed[bucket_id].goal, false)}
                </text>
                <text
                  x={goal_x}
                  y={goal_y}
                  dx={0}
                  dy={20}
                  textAnchor="end">
                  {computed[bucket_id].end_date.format('MMM YYYY')}
                </text>
              </g>)
            }
            return (<g key={bucket_id}>
              {forecast_line}
              {goal_circle}
              <path
                d={balance_line(history)}
                fill="transparent"
                stroke={appstate.buckets[bucket_id].color}
                strokeWidth={2} />
              {last_circle}
            </g>)
          })}
        </svg>
      }}
    />
  }
}