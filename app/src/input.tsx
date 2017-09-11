import * as React from 'react'
import * as cx from 'classnames'
import * as _ from 'lodash'
import * as moment from 'moment'
import { tx } from './i18n'


export function onKeys(mapping:object):((ev)=>void) {
  let actual_mapping = {};
  _.each(mapping, (val, key) => {
    key.split(',').forEach(keypart => {
      actual_mapping[keypart] = val;
    })
  })
  return (ev) => {
    let handler = actual_mapping[ev.key];
    if (handler) {
      return handler(ev);
    }
  }
}


interface TextInputProps {
  value: string|number|null;
  onChange: (newval)=>void;
  className?: string;
}
export class TextInput extends React.Component<TextInputProps, {
  value: string|number|null;
}> {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    }
  }
  render() {
    let { value, onChange, className, ...rest } = this.props;
    value = this.state.value;
    return (<input
      type="text"
      value={value}
      onChange={this.onChange}
      className={cx(
        className,
        'ctx-matching-input',
      )}
      {...rest} />)
  }
  onChange = (ev) => {
    this.setState({value: ev.target.value});
    this.props.onChange(ev.target.value);
  }
}

export function debounceChange(func:(...args)=>any) {
  return _.debounce(func, 250, {leading: false, trailing: true});
}


interface DebouncedInputProps {
  value: any;
  onChange: (newval:any)=>void;
  blendin?: boolean;
  [k:string]: any;
}
export class DebouncedInput extends React.Component<DebouncedInputProps, {
  value: any;
}> {
  constructor(props) {
    super(props)
    this.state = {
      value: props.value,
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value) {
      this.setState({value: nextProps.value});
    }
  }
  onChange = (ev) => {
    let val = ev.target.value;
    if (val !== this.state.value) {
      this.setState({value: val}, () => {
        this.emitChange();
      })
    }
  }
  emitChange = debounceChange(() => {
    this.props.onChange(this.state.value);
  })
  render() {
    let { value, onChange, className, blendin, ...rest } = this.props;
    className = cx(className, {
      'ctx-matching-input': blendin,
    })
    return <input
      onChange={this.onChange}
      value={this.state.value}
      className={className}
      {...rest} />
  }
}

const LEFT_ARROW = '\u25c0'
const RIGHT_ARROW = '\u25b6'

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year, month)=>void;
  className?: string;
}
export class MonthSelector extends React.Component<MonthSelectorProps, any> {
  private minyear = 1900;
  constructor(props) {
    super(props)
    this.state = {
      year: props.year,
      month: props.month,
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      year: nextProps.year,
      month: nextProps.month,
    })
  }
  render() {
    let { className } = this.props;
    let months = moment.monthsShort();
    let current_month = this.state.month - 1;
    let options = months.map((name, idx) => {
      return <option key={idx} value={idx}>{name.toUpperCase()}</option>
    })
    let cls = cx(`month-selector bg-${this.state.month}`, className);
    return (<div className={cls}>
      <button onClick={this.increment(-1)}>{tx.langpack.dir === 'ltr' ? LEFT_ARROW : RIGHT_ARROW}</button>
      <select
        className={`month color-${this.state.month}`}
        value={current_month}
        onChange={this.monthChanged}>
        {options}
      </select>
      <input
        className="year"
        type="text"
        size={4}
        value={this.state.year}
        onChange={this.yearChanged} />
      <button onClick={this.increment(1)}>{tx.langpack.dir === 'ltr' ? RIGHT_ARROW : LEFT_ARROW}</button>
    </div>);
  }
  increment(amount) {
    return (ev) => {
      let month = this.state.month + amount;
      month--; // move to 0-based indexing
      let year = this.state.year;
      while (month < 0) {
        month = 12 + month;
        if (!isNaN(year)) {
          year -= 1;  
        }
      }
      while (month >= 12) {
        month = month - 12;
        if (!isNaN(year)) {
          year += 1;
        }
      }
      month++; // return to 1-based indexing
      this.setDate(year, month);
    }
  }
  isValidYear(year):boolean {
    if (isNaN(year)) {
      return false;
    } else {
      return year >= this.minyear;
    }
  }
  monthChanged = (ev) => {
    let new_month = parseInt(ev.target.value) + 1;
    this.setDate(this.state.year, new_month);
  }
  yearChanged = (ev) => {
    let new_year = parseInt(ev.target.value);
    this.setDate(new_year, this.state.month);
  }
  setDate(year:number, month:number) {
    let newstate:any = {year, month};
    if (isNaN(year)) {
      newstate = {year:'', month};
      this.setState(newstate);
      return;
    }
    if (this.isValidYear(year)) {
      this.props.onChange(year, month);
    }
    this.setState(newstate);
  }
}
