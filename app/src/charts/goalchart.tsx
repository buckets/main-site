import * as React from 'react'
import * as moment from 'moment'
import { SizeAwareDiv } from './util'
import { AppState, manager } from '../budget/appstate'

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
        posted`, {
      $bucket_id: props.bucket_id,
    })
    console.log(rows);
  }
  render() {
    let { divProps } = this.props;
    return <SizeAwareDiv {...divProps}
      guts={dims => {
        return <svg
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${dims.width} ${dims.height}`}>
        </svg>
      }}
    />
  }
}