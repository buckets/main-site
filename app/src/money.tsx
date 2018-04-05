import * as React from 'react';
import * as cx from 'classnames';
import { cents2decimal, decimal2cents, fancyEval, seps } from 'buckets-core/dist/money'
export { cents2decimal, decimal2cents, setSeparators } from 'buckets-core/dist/money'

let ANIMATION_ENABLED = true;

export function setAnimationEnabled(value:boolean) {
  ANIMATION_ENABLED = value;
}

interface MoneyInputProps {
  value?: number;
  onChange?: (value:number)=>any;
  className?: string;
  [k:string]: any;
}
export class MoneyInput extends React.Component<MoneyInputProps, {
  display:string,
  focused:boolean,
}> {
  constructor(props) {
    super(props)
    this.state = {
      display: cents2decimal(props.value) || '',
      focused: false,
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== undefined) {
      var current = this.display2Cents(this.state.display);
      if ((current && current !== nextProps.value) || (!current && nextProps.value)) {
        // effectively different
        this.setState({display: cents2decimal(nextProps.value) || ''})
      }
    }
  }
  display2Cents(display) {
    try {
      var answer = fancyEval(display);  
    } catch(err) {
    }
    answer = answer || '';
    return decimal2cents(answer);
  }
  onDisplayChanged(e) {
    var display = e.target.value;
    var value = this.display2Cents(display);
    this.setState({display: display}, () => {
      if (this.props.onChange) {
        this.props.onChange(value);
      }
    });
  }
  onFocus = () => {
    this.setState({focused: true});
  }
  onBlur = () => {
    this.setState({focused: false});
  }
  render() {
    let { value, onChange, className, ...rest } = this.props;
    let computed_value_elem = null;
    let computed_value = this.display2Cents(this.state.display);
    if (computed_value !== decimal2cents(this.state.display)) {
      computed_value_elem = (<Money
        className="computed-value"
        noanimate
        value={computed_value}/>);
    }
    let outer_cls = cx('money-input', className, {
      focused: this.state.focused,
      computed: computed_value_elem !== null,
    })
    let size = this.state.display.length+1;
    return (
      <div className={outer_cls}>
        <input
          type="text"
          size={size}
          value={this.state.display}
          onChange={this.onDisplayChanged.bind(this)}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          {...rest}
        />{computed_value_elem}
      </div>
    );
  }
}

let DEFAULT = {
  symbol: '',
}
export function setDefaultSymbol(symbol:string) {
  DEFAULT.symbol = symbol;
}

interface MoneyProps {
  value: number;
  className?: string;
  hidezero?: boolean;
  hideCents?: boolean;
  hideZeroCents?: boolean;
  noFaintCents?: boolean;
  noanimate?: boolean;
  nocolor?: boolean;
  symbol?: string|boolean;
  round?: boolean;
  [x:string]: any;
}
export class Money extends React.Component<MoneyProps, {
  old_value: number;
  current_value: number;
  duration: number;
  start_time: number;
  animating: boolean;
  anim_show_decimal: boolean;
}> {
  constructor(props) {
    super(props)
    this.state = {
      current_value: props.value,
      old_value: props.value,
      duration: 0,
      start_time: 0,
      animating: false,
      anim_show_decimal: false,
    }
  }
  toString() {
    return `<Money value=${this.props.value} />`
  }
  animateToNewValue(newval:number, duration:number=100) {
    let anim_show_decimal = !!(newval % 100) || !!(this.props.value % 100);
    this.setState({
      animating: true,
      start_time: 0,
      old_value: this.state.current_value,
      duration: duration,
      anim_show_decimal: anim_show_decimal,
    }, () => {
      window.requestAnimationFrame(this.step.bind(this))  
    })
  }
  step(timestamp) {
    if (!this.state.animating) {
      return;
    }
    let progress;
    if (!this.state.start_time) {
      this.setState({
        start_time: timestamp,
        animating: true,
      }, () => {
        window.requestAnimationFrame(this.step.bind(this));
      });
      progress = 0;
    } else {
      progress = (timestamp - this.state.start_time) / this.state.duration;
      if (progress >= 1) {
        // done
        this.setState({
          current_value: this.props.value,
          animating: false,
          anim_show_decimal: false,
        });
      } else {
        // animating
        let num = Math.floor(progress * (this.props.value - this.state.old_value) + this.state.old_value);
        if (!this.state.anim_show_decimal) {
          num -= num % 100;
        }
        this.setState({
          current_value: num,
          animating: true,
        });
        window.requestAnimationFrame(this.step.bind(this))
      }
    }
  }
  componentWillReceiveProps(nextProps:MoneyProps) {
    if (ANIMATION_ENABLED && !nextProps.noanimate && nextProps.value !== this.props.value) {
      this.animateToNewValue(nextProps.value);
    }
  }
  componentWillUnmount() {
    this.setState({
      animating: false,
    })
  }
  render() {
    let { value, className, hidezero, noanimate, nocolor, symbol, round, hideCents, hideZeroCents, noFaintCents, ...rest } = this.props;
    let going_up = true;
    if (ANIMATION_ENABLED && !noanimate) {
      // animating
      going_up = value > this.state.current_value;
      value = this.state.current_value;
    }
    let display = cents2decimal(value, {
      round: round,
      show_decimal: !hideCents || this.state.anim_show_decimal,
    }) || '0';
    if (symbol && display) {
      let symbol_display:string = symbol === true ? DEFAULT.symbol : symbol;
      if (value < 0) {
        display = `-${symbol_display}${display.substr(1)}`
      } else {
        display = symbol_display + display;
      }
    }
    let parts = display.split(seps.decimal, 2);
    let zeroCents = true;
    let display_components = [];
    if (parts.length === 2) {
      zeroCents = parts[1] === '0'.repeat(parts[1].length);
      display_components.push(<span className="dollar" key="dollar">{parts[0]}</span>)
      if (zeroCents && hideZeroCents) {
        // don't show cents
      } else {
        display_components.push(<span className={cx("decimal", {
          "zero": zeroCents,
        })} key="decimal">{seps.decimal}</span>);
        display_components.push(<span className={cx("cents", {
          "zero": zeroCents,
        })} key="cents">{parts[1]}</span>)
      }
    } else {
      display_components.push(<span className="dollar" key="dollar">{display}</span>)
    }
    return (<span className={cx(
      'money',
      className, {
        number: !nocolor,
        negative: value < 0 && !nocolor,
        zero: value === 0,
        hidezero: hidezero,
        'faint-cents': !noFaintCents,
        animating: this.state.animating,
        up: this.state.animating && going_up,
        down: this.state.animating && !going_up,
      })} {...rest}>{display_components}</span>);
  }

}
