import * as React from 'react'
import * as cx from 'classnames'

export const DEFAULT_COLORS = [
  'rgba(52, 152, 219,1.0)', // blue
  'rgba(41, 128, 185,1.0)', // darker-blue
  'rgba(26, 188, 156,1.0)', // teal
  'rgba(22, 160, 133,1.0)', // darker-teal
  'rgba(46, 204, 113,1.0)', // green
  'rgba(39, 174, 96,1.0)', // darker-green
  'rgba(231, 76, 60,1.0)', // red
  'rgba(192, 57, 43,1.0)', // darker-red
  'rgba(230, 126, 34,1.0)', // orange
  'rgba(211, 84, 0,1.0)', // darker-orange
  'rgba(241, 196, 15,1.0)', // yellow
  'rgba(243, 156, 18,1.0)', // darker-yellow
  'rgba(155, 89, 182,1.0)', // purple
  'rgba(142, 68, 173,1.0)', // darker-purple
  'rgba(52, 73, 94,1.0)', // darkblue
  'rgba(44, 62, 80,1.0)', // darker-darkblue
]

export class ColorPicker extends React.Component<{
  value: string;
  onChange: (val:string)=>any;
  options?: string[];
  className?: string;
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
    let { options, onChange, className } = this.props;
    let { value } = this.state;
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
      tabIndex={1}
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