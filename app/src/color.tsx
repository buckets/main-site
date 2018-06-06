import { DEFAULT_COLORS } from 'buckets-core/dist/color'
import * as React from 'react'
import * as cx from 'classnames'

export class ColorPicker extends React.Component<{
  value: string;
  onChange: (val:string)=>any;
  options?: string[];
  className?: string;
  tabIndex?: number;
}, {
  value: string;
  open: boolean;
}> {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      value: props.value,
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState({value: nextProps.value});
  }
  togglePicker = () => {
    this.setState({open: !this.state.open});
  }
  openPicker = () => {
    this.setState({open: true});
  }
  closePicker = () => {
    this.setState({open: false});
  }
  render() {
    let { options, onChange, className, tabIndex } = this.props;
    let { value } = this.state;
    tabIndex = tabIndex || 0;
    options = options || DEFAULT_COLORS.slice();
    if (options.indexOf(value) === -1) {
      // custom color
      options.push(value);
    }
    let guts;
    if (this.state.open) {
      // open state
      let option_elems = options.map(option => {
        return <div
          key={option}
          style={{backgroundColor: option}}
          className={cx("dot",
            {
              selected: option === value,
            },
          )}
          onClick={() => {
            onChange(option);
            this.setState({value: option})
          }}
        />
      })
      guts = <div className="picker-wrap">
        <div className="pallete">
          {option_elems}
        </div>
      </div>
    } else {
      // closed
    }
    return <div
      className={cx(
        "color-picker",
        className,
        {
          open: this.state.open,
        }
      )}
      tabIndex={tabIndex}
      onBlur={(ev) => {
        this.closePicker();
      }}>
      <div
        style={{backgroundColor: value}}
        className="dot"
        onClick={this.togglePicker} />
      {guts}
    </div>
  }
}