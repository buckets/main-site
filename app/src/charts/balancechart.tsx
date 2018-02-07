import * as React from 'react'
import * as moment from 'moment'
import * as cx from 'classnames'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { v4 as uuid } from 'uuid'
import { SizeAwareDiv, CHART_STYLES } from './util'
import { AppState, manager } from '../budget/appstate'
import { COLORS, opacity } from '../color'
import { cents2decimal } from '../money'
import { Transaction, computeBucketData } from '../models/bucket'
import { tsfromdb } from '../time'

interface SparklineProps {
  height?: number;
  width?: number;
  className?: string;
  data: Array<{
    x: number;
    y: number;
  }>;
}
export class Sparkline extends React.Component<SparklineProps, {}> {
  render() {
    let { height, width, data, className } = this.props;
    const id = uuid();
    const zeroline = 0;
    const padding = 2;
    width = width || 150;
    height = height || 20;
    let miny = zeroline;
    let maxy = zeroline;

    data.forEach(d => {
      miny = Math.min(d.y, miny);
      maxy = Math.max(d.y, maxy);
    })

    let [minx, maxx] = d3.extent(data, d => d.x);

    let x = d3.scaleTime()
      .domain([minx, maxx])
      .range([padding, width-padding]);
    let y = d3.scaleLinear()
      .domain([miny, maxy])
      .range([height-padding, padding]);

    let dataline = d3shape.line<any>()
      .x(d => x(d.x))
      .y(d => y(d.y));
      let dataarea = d3shape.area<any>()
      .x(d => x(d.x))
      .y1(d => y(d.y))
      .y0(y(zeroline))

    return <div
      className={cx("sparkline", className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}>
      <svg viewBox={`0 0 ${width} ${height}`}>
        <mask id={`hide-top-${id}`}>
          <rect x={0} y={y(zeroline)} width="100%" height="100%" fill="white" />
        </mask>
        <mask id={`hide-bottom-${id}`}>
          <rect x={0} y="0" width="100%" height={y(zeroline)} fill="white" />
        </mask>

        <line
          x1={x(minx)}
          x2={x(maxx)}
          y1={y(zeroline)}
          y2={y(zeroline)}
          stroke="black"
          strokeWidth={1}
        />

        <g mask={`url(#hide-top-${id})`}>
          <path
            className="neg-area"
            d={dataarea(data)} />
          <path
            className="neg-line"
            d={dataline(data)} />
        </g>
        <g mask={`url(#hide-bottom-${id})`}>
          <path
            className="pos-area"
            d={dataarea(data)} />
          <path
            className="pos-line"
            d={dataline(data)} />
        </g>
      </svg>
    </div>
  }
}


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
    let computed = computeBucketData(bucket.kind, bucket, {
      today: moment.utc(),
      balance: bucket.balance,
    })

    let startTime = tsfromdb(transactions[transactions.length-1].posted);
    let startSeconds = startTime.valueOf();
    let endTime = tsfromdb(transactions[0].posted);
    let endSeconds = endTime.valueOf();

    let date_tick_format = 'MMM YYYY';
    if (endTime.diff(startTime, 'months') <= 2) {
      date_tick_format = 'DD MMM';
    }
    
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

        let extra = () => {
          return null;
        };

        if (bucket.kind === 'goal-date' || bucket.kind === 'goal-deposit' || bucket.kind === 'deposit-date') {
          lowval = Math.min(lowval, computed.goal);
          highval = Math.max(highval, computed.goal);
          if (computed.end_date && computed.end_date.isAfter(endTime)) {
            endTime = computed.end_date.valueOf();
          }
          extra = () => {
            let last = balancehistory[0];
            let end_date = computed.end_date;
            if (!end_date) {
              end_date = moment.utc();
            }
            let goal_x = x(end_date.valueOf());
            let goal_y = y(computed.goal);
            return <g>
              
              <line
                x1={x(last.date.valueOf())}
                y1={y(last.balance)}
                x2={goal_x}
                y2={goal_y}
                style={CHART_STYLES.forecastLine}
              />
              <circle
                r={5}
                fill={bucket.color}
                cx={goal_x}
                cy={goal_y}
              />
              <circle
                r={3}
                fill={COLORS.blackish}
                cx={x(last.date.valueOf())}
                cy={y(last.balance)}
              />
              <text
                x={x(last.date.valueOf())}
                y={y(last.balance)}
                dy={15}
                style={CHART_STYLES.axislabel}
                textAnchor={x(last.date.valueOf()) > dims.width/2 ? "end" : "start"}
              >{cents2decimal(last.balance)}</text>
            </g>
          }
        }

        let x = d3.scaleTime()
          .domain([startSeconds, endSeconds])
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
            <rect x={x(startSeconds)} y={y(0)} width="100%" height="100%" fill="white" />
          </mask>
          <mask id="show-pos-balance-mask">
            <rect x={x(startSeconds)} y="0" width="100%" height={y(0)} fill="white" />
          </mask>
          <mask id="neg-fill-mask">
            <rect x={x(startSeconds)} y="0" width="100%" height="100%" fill="black" />
            <use
              xlinkHref="#balance-curve"
              fill="white" />
          </mask>

          <line
            x1={x(startSeconds)}
            x2={x(endSeconds)}
            y1={y(0)}
            y2={y(0)}
            style={CHART_STYLES.axis} />
          <line
            x1={x(startSeconds)}
            x2={x(startSeconds)}
            y1={y(lowval)}
            y2={y(highval)}
            style={CHART_STYLES.axis} />
          <line
            x1={x(endSeconds)}
            x2={x(endSeconds)}
            y1={y(lowval)}
            y2={y(highval)}
            style={CHART_STYLES.axis} />

          {date_ticks.map((tick, i) => {
            let xpos = x(tick);
            let label = moment(tick).format(date_tick_format);
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

          <line x1={x(startSeconds)} y1={y(lowval)} x2={x(endSeconds)} y2={y(lowval)} style={CHART_STYLES.tracer} />
          <text
            x={x(startSeconds)}
            y={y(lowval)}
            dy={-3}
            dx={3}
            style={CHART_STYLES.axislabel}
          >{cents2decimal(lowval)}</text>

          <line x1={x(startSeconds)} y1={y(highval)} x2={x(endSeconds)} y2={y(highval)} style={CHART_STYLES.tracer} />
          <text
            x={x(startSeconds)}
            y={y(highval)}
            dy={-3}
            dx={3}
            style={CHART_STYLES.axislabel}
          >{cents2decimal(highval)}</text>

          <g>
            <rect
              x={x(startSeconds)}
              y={y(0)}
              width={x(endSeconds) - x(startSeconds)}
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

          {extra()}

        </svg>
      }}/>
  }
}