import * as React from 'react'
import * as d3 from 'd3'
import { COLORS } from '../color'


export const CHART_STYLES = {
  axis: {
    stroke: COLORS.lighter_grey,
    strokeWidth: 1,
  },
  tracer: {
    stroke: COLORS.lighter_grey,
    strokeWidth: 1,
    strokeDasharray: "5, 5",
  }
}

interface Dims {
  height: number;
  width: number;
}

export class SizeAwareDiv extends React.Component<{
  guts: (args:Dims)=>JSX.Element;
  [x:string]: any;
}, {
  height: number;
  width: number;
}> {
  private elem:HTMLElement;
  constructor(props) {
    super(props);
    this.state = {
      height: 0,
      width: 0,
    }
  }
  recomputeState() {
    let bounds = d3.select(this.elem).node().getBoundingClientRect();
    this.setState({
      height: bounds.height || 0,
      width: bounds.width,
    })
  }
  componentDidMount() {
    this.recomputeState();
    window.addEventListener('resize', this.windowResized, false);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.windowResized);
  }
  windowResized = () => {
    this.recomputeState();
  }
  render() {
    let { guts, ...rest } = this.props;
    return <div ref={elem => this.elem = elem} {...rest}>
      {guts(this.state)}
    </div>
  }
}

