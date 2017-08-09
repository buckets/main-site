import * as React from 'react'
import * as moment from 'moment'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { SizeAwareDiv } from './util'
import { AppState, manager } from '../budget/appstate'
import { ensureUTCMoment } from '../time'
import { COLORS } from '../color'
import { computeBucketData } from '../models/bucket'

interface BucketGoalChartProps {
  appstate: AppState;
  bucket_id: number;
  divProps?: object;
}
export class BucketGoalChart extends React.Component<BucketGoalChartProps, {
  balance_history: {
    time: moment.Moment;
    balance: number;
  }[];
}> {
  constructor(props) {
    super(props);
    this.state = {
      balance_history: [],
    }
    this.recomputeState(props);
  }
  async recomputeState(props:BucketGoalChartProps) {
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
      $bucket_id: props.bucket_id,
    })
    let balance = props.appstate.bucket_balances[props.bucket_id];
    let balance_history = rows.map(row => {
      let ret = {
        time: ensureUTCMoment(row.posted),
        balance: balance
      }
      balance -= row.amount;
      return ret;
    })
    balance_history.reverse();
    this.setState({balance_history: balance_history});
  }
  render() {
    let { divProps, appstate, bucket_id } = this.props;
    let bucket = appstate.buckets[bucket_id];
    let computed = computeBucketData(bucket.kind, bucket, {
      today: appstate.defaultPostingDate,
      balance: bucket.balance,
    })
    console.log('computed', computed);
    return <SizeAwareDiv {...divProps}
      guts={dims => {
        if (!this.state.balance_history.length) {
          return null;
        }
        let min_time = null;
        let max_time = computed.end_date.unix();
        let min_bal = computed.goal;
        let max_bal = computed.goal;
        let last_datapoint;
        this.state.balance_history.forEach(datapoint => {
          let time = datapoint.time.unix();
          min_time = min_time === null ? time : Math.min(time, min_time);
          max_time = Math.max(time, max_time);
          min_bal = Math.min(datapoint.balance, min_bal);
          max_bal = Math.max(datapoint.balance, max_bal);
          last_datapoint = datapoint;
        })

        console.log('min_bal', min_bal);
        console.log('max_bal', max_bal);
        console.log('min_time', min_time);
        console.log('max_time', max_time);

        let x = d3.scaleLinear()
          .domain([min_time, max_time])
          .range([5, dims.width ? dims.width - 5 : 6]);
        let y = d3.scaleLinear()
          .domain([min_bal < 0 ? min_bal : 0, max_bal])
          .range([dims.height-10, 10]);

        let balance_line = d3.line<any>()
          .x(d => x(d.time.unix()))
          .y(d => y(d.balance))
          .curve(d3shape.curveMonotoneX);

        let balance_path = balance_line(this.state.balance_history);
        console.log('path', balance_path);

        return <svg
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${dims.width} ${dims.height}`}>

          <line
            x1={x(min_time)}
            x2={x(max_time)}
            y1={y(0)}
            y2={y(0)}
            stroke={COLORS.lighter_grey}
            strokeWidth={1}
            />

          <path
            d={balance_path}
            fill="transparent"
            stroke={COLORS.blue}
            strokeWidth={3} />
          <line
            x1={x(last_datapoint.time.unix())}
            x2={x(computed.end_date.unix())}
            y1={y(last_datapoint.balance)}
            y2={y(computed.goal)}
            stroke={COLORS.lighter_grey}
            strokeWidth={2}
            strokeDasharray="5, 5"
            />
          <circle
            r={5}
            fill={bucket.color}
            cx={x(computed.end_date.unix())}
            cy={y(computed.goal)}
          />
        </svg>
      }}
    />
  }
}