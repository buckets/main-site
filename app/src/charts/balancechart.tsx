import * as React from 'react'
import * as moment from 'moment'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { SizeAwareDiv, CHART_STYLES } from './util'
import { AppState, manager } from '../budget/appstate'
import { COLORS, opacity } from '../color'
import { cents2decimal } from '../money'
import { Transaction } from '../models/bucket'
import { tsfromdb } from '../time'


interface BucketBalanceChartProps {
  appstate: AppState;
  bucket_id: number;
  divProps?: object;
}
export class BucketBalanceChart extends React.Component<BucketBalanceChartProps, {
  transactions: Transaction[]
}> {
  constructor(props) {
    super(props);
    this.state = {
      transactions: [],
    }
    this.recomputeState(props);
  }
  componentWillReceiveProps(nextProps) {
    this.recomputeState(nextProps);
  }
  async recomputeState(props:BucketBalanceChartProps) {
    let transactions = await manager.store.buckets.listTransactions({
      bucket_id: props.bucket_id,
      posted: {
        onOrAfter: props.appstate.viewDateRange.onOrAfter.clone().subtract(3, 'years'),
      }
    });
    this.setState({
      transactions: transactions,
    });
  }
  render() {
    let { divProps, bucket_id, appstate } = this.props;
    let { transactions } = this.state;
    if (!transactions.length) {
      return null;
    }

    let bucket = appstate.buckets[bucket_id];

    let startTime = tsfromdb(transactions[transactions.length-1].posted).valueOf();
    let endTime = tsfromdb(transactions[0].posted).valueOf();
    
    let lowval = 0;
    let highval = 0;

    let balance = bucket.balance;
    let balancehistory = transactions.map(trans => {
      let ret = {
        amount: trans.amount,
        date: tsfromdb(trans.posted),
        balance: balance,
      }
      lowval = Math.min(lowval, balance);
      highval = Math.max(highval, balance);
      balance -= trans.amount;
      return ret;
    })
    
    return <SizeAwareDiv {...divProps}
      guts={dims => {
        let x = d3.scaleTime()
          .domain([startTime, endTime])
          .range([10, dims.width-10]);
        let y = d3.scaleLinear()
          .domain([lowval, highval])
          .range([dims.height-12, 12]);

        let date_ticks = x.ticks(4);

        let balance_area = d3shape.area<any>()
          .x((d,i) => x(d.date))
          .y1(d => y(d.balance))
          .y0(y(0))
          .curve(d3shape.curveStepAfter);
        let balance_line = d3shape.line<any>()
          .x((d,i) => x(d.date))
          .y(d => y(d.balance))
          .curve(d3shape.curveStepAfter);

        return <svg
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${dims.width} ${dims.height}`}>
          <defs>
            <path id="balance-curve" d={balance_area(balancehistory)} />
          </defs>

          <mask id="show-neg-balance-mask">
            <rect x={x(startTime)} y={y(0)} width="100%" height="100%" fill="white" />
          </mask>
          <mask id="show-pos-balance-mask">
            <rect x={x(startTime)} y="0" width="100%" height={y(0)} fill="white" />
          </mask>
          <mask id="neg-fill-mask">
            <rect x={x(startTime)} y="0" width="100%" height="100%" fill="black" />
            <use
              xlinkHref="#balance-curve"
              fill="white" />
          </mask>

          <line
            x1={x(startTime)}
            x2={x(endTime)}
            y1={y(0)}
            y2={y(0)}
            style={CHART_STYLES.axis} />
          <line
            x1={x(startTime)}
            x2={x(startTime)}
            y1={y(lowval)}
            y2={y(highval)}
            style={CHART_STYLES.axis} />
          <line
            x1={x(endTime)}
            x2={x(endTime)}
            y1={y(lowval)}
            y2={y(highval)}
            style={CHART_STYLES.axis} />

          {date_ticks.map((tick, i) => {
            let xpos = x(tick);
            let label = moment(tick).format('MMM YYYY');
            return <g>
              <line
                key={i}
                x1={xpos}
                x2={xpos}
                y1={y(highval)}
                y2={y(lowval)}
                style={CHART_STYLES.tick}
              />
              <text
                style={CHART_STYLES.ticklabel}
                dy={11}
                x={xpos}
                y={y(lowval)}
                textAnchor="middle"
              >{label}</text>
            </g>
          })}

          <line x1={x(startTime)} y1={y(lowval)} x2={x(endTime)} y2={y(lowval)} style={CHART_STYLES.tracer} />
          <text
            x={x(startTime)}
            y={y(lowval)}
            dy={-3}
            dx={3}
            style={CHART_STYLES.axislabel}
          >{cents2decimal(lowval)}</text>

          <line x1={x(startTime)} y1={y(highval)} x2={x(endTime)} y2={y(highval)} style={CHART_STYLES.tracer} />
          <text
            x={x(startTime)}
            y={y(highval)}
            dy={-3}
            dx={3}
            style={CHART_STYLES.axislabel}
          >{cents2decimal(highval)}</text>

          <g>
            <rect
              x={x(startTime)}
              y={y(0)}
              width={x(endTime) - x(startTime)}
              height={y(lowval) -  y(0)}
              fill={opacity(COLORS.red, 0.25)}
              mask="url(#neg-fill-mask)"
              />
            <path
              stroke={COLORS.red}
              strokeWidth={1}
              fill="transparent"
              d={balance_line(balancehistory)} />
          </g>
          
          <g mask="url(#show-pos-balance-mask)">
            <use
              xlinkHref="#balance-curve"
              fill={opacity(COLORS.green, 0.25)}
            />
            <path
              stroke={COLORS.green}
              strokeWidth={1}
              fill="transparent"
              d={balance_line(balancehistory)} />
          </g>

        </svg>
      }}/>
  }
}