import * as React from 'react'
import * as moment from 'moment'
import * as d3 from 'd3'
import * as d3shape from 'd3-shape'
import { SizeAwareDiv, CHART_STYLES } from './util'
import { AppState, manager } from '../budget/appstate'
// import { ensureUTCMoment } from '../time'
import { COLORS, opacity } from '../color'
import { cents2decimal } from '../money'
import { chunkTime } from '../time'

interface BucketExpenseProps {
  appstate: AppState;
  bucket_id: number;
  divProps?: object;
}
interface MonthExpense {
  month: moment.Moment;
  expenses: number;
}
export class BucketExpenseChart extends React.Component<BucketExpenseProps, {
  months: MonthExpense[]
}> {
  constructor(props) {
    super(props);
    this.state = {
      months: [],
    }
    this.recomputeState(props);
  }
  componentWillReceiveProps(nextProps) {
    this.recomputeState(nextProps);
  }
  async recomputeState(props:BucketExpenseProps) {
    let earliestTrans = await manager.store.buckets.earliestTransaction(props.bucket_id)
    let start = earliestTrans.clone().startOf('month');
    let end = props.appstate.viewDateRange.before;
    let months = await Promise.all(chunkTime({start:start, end:end, step:1, unit:'month'}).map(async interval => {
      let expenses = await manager.store.reports.bucketExpenses({
        start: interval.start,
        end: interval.end,
        bucket_id: props.bucket_id,
      })
      return {
        month: interval.start,
        expenses: expenses,
      }
    }))
    this.setState({
      months: months,
    });
  }
  render() {
    let { divProps, bucket_id, appstate } = this.props;
    let { months } = this.state;
    if (!months.length) {
      return null;
    }

    let bucket = appstate.buckets[bucket_id];

    let startTime = months[0].month.unix();
    let endTime = months[months.length-1].month.unix();
    let lowval = bucket.deposit;
    let highval = bucket.deposit;

    months.forEach(month => {
      lowval = Math.min(lowval, Math.abs(month.expenses));
      highval = Math.max(highval, Math.abs(month.expenses));
    })
    
    return <SizeAwareDiv {...divProps}
      guts={dims => {
        let x = d3.scaleLinear()
          .domain([startTime, endTime])
          .range([10, dims.width-10]);
        let y = d3.scaleLinear()
          .domain([0, highval])
          .range([dims.height-12, 12]);

        let expense_area = d3shape.area<MonthExpense>()
          .x((d,i) => x(d.month.unix()))
          .y1(d => y(Math.abs(d.expenses)))
          .y0(y(0))
          .curve(d3shape.curveMonotoneX);
        let expense_line = d3shape.line<MonthExpense>()
          .x((d,i) => x(d.month.unix()))
          .y(d => y(Math.abs(d.expenses)))
          .curve(d3shape.curveMonotoneX);

        return <svg
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${dims.width} ${dims.height}`}>
          <defs>
            <path id="expense-curve" d={expense_area(months)} />
          </defs>

          <mask id="show-low-expense-mask">
            <rect x={x(startTime)} y={y(bucket.deposit)} width="100%" height="100%" fill="white" />
          </mask>
          <mask id="show-high-expense-mask">
            <rect x={x(startTime)} y="0" width="100%" height={y(bucket.deposit)} fill="white" />
          </mask>
          <mask id="hide-expense-area-mask">
            <rect x={x(startTime)} y="0" width="100%" height="100%" fill="white" />
            <use
              xlinkHref="#expense-curve"
              fill="black" />
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
            y1={y(0)}
            y2={y(highval)}
            style={CHART_STYLES.axis} />
          <line
            x1={x(endTime)}
            x2={x(endTime)}
            y1={y(0)}
            y2={y(highval)}
            style={CHART_STYLES.axis} />

          <line x1={x(startTime)} y1={y(lowval)} x2={x(endTime)} y2={y(lowval)} style={CHART_STYLES.tracer} />
          <text
            x={x(startTime)}
            y={y(lowval)}
            dy={10}
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

          <g mask="url(#show-low-expense-mask)">
            <rect
              x={x(startTime)}
              y={y(bucket.deposit)}
              width={x(endTime) - x(startTime)}
              height={y(lowval) -  y(bucket.deposit)}
              fill={opacity(COLORS.green, 0.25)}
              mask="url(#hide-expense-area-mask)"
              />
            <use
              xlinkHref="#expense-curve"
              fill="transparent"
            />
            <path
              stroke={COLORS.green}
              strokeWidth={2}
              fill="transparent"
              d={expense_line(months)} />
          </g>
          
          <g mask="url(#show-high-expense-mask)">
            <use
              xlinkHref="#expense-curve"
              fill={opacity(COLORS.red, 0.25)}
            />
            <path
              stroke={COLORS.red}
              strokeWidth={2}
              fill="transparent"
              d={expense_line(months)} />
          </g>

          <line
            x1={x(startTime)}
            x2={x(endTime)}
            y1={y(bucket.deposit)}
            y2={y(bucket.deposit)}
            stroke={COLORS.blackish} />
          <text
            x={x(startTime)}
            y={y(bucket.deposit)}
            dy={-3}
            dx={3}
            style={CHART_STYLES.axislabel}
          >{cents2decimal(bucket.deposit)}</text>
        </svg>
      }}/>
  }
}