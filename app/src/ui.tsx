import * as React from 'react'
import * as cx from 'classnames'

export class ProgressBar extends React.PureComponent<{
  percent:number;
  color?:string;
  width?:string;
  label?: string;
},{}> {
  render() {
    let { percent, color, width, label } = this.props;
    let outerStyle:any = {};
    let innerStyle:any = {
      width: `${percent}%`,
    }
    if (color) {
      outerStyle.borderColor = color;
      innerStyle.backgroundColor = color;
    }
    if (width) {
      outerStyle.width = width;
    }
    return <div className="progress-bar-wrap">
      <div className={cx("progress-bar", {
          overhalf: percent >= 50,
          complete: percent >= 100,
        })} style={outerStyle}>
        <div className="bar" style={innerStyle}>
          <div className="percent-label">{percent}%</div>
        </div>
      </div>
      <div className="text-label">{label}</div>
    </div>
  }
}
