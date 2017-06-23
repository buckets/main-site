import * as React from 'react';
import * as cx from 'classnames';
import * as math from 'mathjs';

const _groupregex = new RegExp(',', "g");
function fancyEval(x:string) {
  x = x.replace(_groupregex, '');
  return math.eval(x).toString();
}

interface MoneyInputProps {
  value: number;
  onChange: (value:number)=>any;
  className?: string;
}
export class MoneyInput extends React.Component<MoneyInputProps, {display:string}> {
  constructor(props) {
    super(props)
    this.state = {
      display: cents2decimal(props.value) || '',
    }
  }
  componentWillReceiveProps(nextProps) {
    var current = this.display2Cents(this.state.display);
    if ((current && current !== nextProps.value) || (!current && nextProps.value)) {
      // effectively different
      this.setState({display: cents2decimal(nextProps.value) || ''})
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
      this.props.onChange(value);
    });
  }
  render() {
    let { value, onChange, className, ...rest } = this.props;
    let computed_value_elem;
    let computed_value = this.display2Cents(this.state.display);
    let input_classes = cx(className);
    if (computed_value !== decimal2cents(this.state.display)) {
      input_classes = cx(input_classes, 'with-computed');
      let cls = cx(
        className,
        'computed-value', {
        negative: computed_value < 0,
      })
      computed_value_elem = (<div className={cls}>{cents2decimal(computed_value)}</div>);
    }
    let outer_cls = cx('money-input', className)
    return (
      <div className={outer_cls}>
        <input
          type="text"
          value={this.state.display}
          onChange={this.onDisplayChanged}
          {...rest}
          className={input_classes} />&nbsp;{computed_value_elem}
      </div>
    );
  }
}

interface MoneyProps {
  value: number;
  className?: string;
  hidezero?: boolean;
  [x:string]: any;
}
export class Money extends React.Component<MoneyProps, any> {
  render() {
    let { value, className, hidezero, ...rest } = this.props;
    let display = cents2decimal(value) || '0';
    if (hidezero && !value) {
      display = '';
    }
    return (<span className={cx(
      'number',
      className, {
      negative: value < 0,
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
