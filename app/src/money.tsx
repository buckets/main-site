import * as React from 'react';
import * as cx from 'classnames';
import * as math from 'mathjs';

const _groupregex = new RegExp(',', "g");
function fancyEval(x:string) {
  x = x.replace(_groupregex, '');
  return math.eval(x).toString();
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
    this.setState({display: display}, function() {
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
  noanimate?: boolean;
  nocolor?: boolean;
  symbol?: string|boolean;
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
  animateToNewValue(newval:number, duration:number=300) {
    let anim_show_decimal = !!(newval % 100) || !!(this.props.value % 100);
    this.setState({
      start_time: 0,
      old_value: this.state.current_value,
      duration: duration,
      anim_show_decimal: anim_show_decimal,
    }, () => {
      window.requestAnimationFrame(this.step.bind(this))  
    })
  }
  step(timestamp) {
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
    if (!nextProps.noanimate && nextProps.value !== this.props.value) {
      this.animateToNewValue(nextProps.value);
    }
  }
  render() {
    let { value, className, hidezero, noanimate, nocolor, symbol, ...rest } = this.props;
    let going_up = true;
    if (!noanimate) {
      // animating
      going_up = value > this.state.current_value;
      value = this.state.current_value;
    }
    let display = cents2decimal(value, this.state.anim_show_decimal) || '0';
    if (hidezero && !value) {
      display = '';
    }
    if (symbol && display) {
      let symbol_display:string = symbol === true ? DEFAULT.symbol : symbol;
      if (value < 0) {
        display = `-${symbol_display}${display.substr(1)}`
      } else {
        display = symbol_display + display;
      }
    }
    return (<span className={cx(
      className, {
        number: !nocolor,
        negative: value < 0 && !nocolor,
        animating: this.state.animating,
        up: this.state.animating && going_up,
        down: this.state.animating && !going_up,
      })} {...rest}>{display}</span>);
  }

}


export let thousand_sep = ',';
export let decimal_sep = '.';

export function cents2decimal(cents:number|null|string, show_decimal?:boolean, show_sep?:boolean):string {
  if (cents === null || cents === undefined || cents === '') {
    return null;
  }
  if (show_decimal === undefined) {
    show_decimal = false;
  }
  if (show_sep === undefined) {
    show_sep = true;
  }
  if (typeof cents === 'string') {
    cents = parseInt(cents);
  }
  var x = Math.abs(cents);
  if (isNaN(x)) {
    x = 0;
    cents = 0;
  }
  var sign = cents < 0 ? '-' : '';

  // Before decimal
  var d = Math.trunc(x / 100).toString();
  var stem = d;
  if (show_sep) {
    var parts = [];
    while (d.length > 3) {
      parts.push(d.substr(d.length-3, 3));
      d = d.substr(0, d.length-3);
    }
    if (d.length) {
      parts.push(d);
    }
    parts.reverse();
    stem = parts.join(thousand_sep);
  }

  // After decimal
  var r = (x % 100);
  var suffix = '';
  if (r || show_decimal) {
    var suffix = r.toString();
    if (suffix.length < 2) {
      suffix = '0' + suffix;
    }
    suffix = decimal_sep + suffix;
  }
  return sign + stem + suffix;
}

export function decimal2cents(string:string):number {
  string = string.trim();

  var negative = false;
  if (string.length && string[0] === '-') {
    string = string.substr(1);
    negative = true;
  }

  var re = new RegExp(thousand_sep, 'g');
  string = string.replace(re, '');
  var parts = string.split(decimal_sep);

  // cents
  var cents = 0;
  if (parts.length == 2) {
    cents = parseInt((parts[1] + '00').substr(0, 2), 10);
  }

  // dollars
  if (parts[0] === '') {
    parts[0] = '0';
  }
  var dollars = parseInt(parts[0], 10);

  if (isNaN(cents) || isNaN(dollars)) {
    return null;
  }

  var sign = negative ? -1 : 1;
  return sign * (Math.abs(dollars) * 100 + cents);
}
