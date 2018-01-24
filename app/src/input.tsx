import * as React from 'react'
import * as cx from 'classnames'
import * as _ from 'lodash'
import * as moment from 'moment'
import { tx } from './i18n'
import { PrefixLogger } from './logging'

const log = new PrefixLogger('(input)');

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

/**
 * Run mapper every time, but only call actor debounced-like
 */
export function debounceOnChange(mapper:Function, actor:Function) {
  let debounced = _.debounce(actor, 250, {leading: false, trailing: true});
  return (...args) => {
    return debounced(mapper(...args));
  }
}


interface DebouncedInputProps {
  value: any;
  element?: string;
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
    let { element, value, onChange, className, blendin, ...rest } = this.props;
    element = element || 'input'
    className = cx(className, {
      'ctx-matching-input': blendin,
    })
    let props = Object.assign({
      onChange: this.onChange,
      value: this.state.value,
      className: className,
    }, rest)
    return React.createElement(element, props)
    // return <input
    //   onChange={this.onChange}
    //   value={this.state.value}
    //   className={className}
    //   {...rest} />
  }
}

const LEFT_ARROW = '\u25c0'
const RIGHT_ARROW = '\u25b6'

interface MonthSelectorProps {
  date: moment.Moment;
  onChange: (date:moment.Moment)=>void;
  className?: string;
}
export class MonthSelector extends React.Component<MonthSelectorProps, {
  date: moment.Moment;
  year: string;
}> {
  private minyear = 1900;
  constructor(props:MonthSelectorProps) {
    super(props);
    const date = props.date.clone().startOf('month');
    this.state = {
      date: date,
      year: date.year().toString(),
    }
  }
  componentWillReceiveProps(nextProps) {
    const date = nextProps.date.clone().startOf('month');
    this.setState({
      date: date,
      year: date.year().toString(),
    })
  }
  render() {
    let { className } = this.props;
    let month_names = moment.monthsShort();
    let current_month = this.state.date.month();
    let options = month_names.map((name, idx) => {
      return <option key={idx} value={idx}>{name.toUpperCase()}</option>
    })
    let cls = cx(`month-selector bg-${current_month+1}`, className);
    return (<div className={cls}>
      <button onClick={this.increment(-1)}>{tx.langpack.dir === 'ltr' ? LEFT_ARROW : RIGHT_ARROW}</button>
      <select
        className={`month color-${current_month+1}`}
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
  increment(amount:number) {
    return () => {
      log.info('click increment', amount);
      log.info('current date', this.state.date && this.state.date.format());
      const new_date = this.state.date.clone().add(amount, 'months');
      log.info('new_date', new_date && new_date.format());
      this.setDate(new_date);
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
    const new_month = parseInt(ev.target.value);
    const new_date = this.state.date.clone().month(new_month);
    this.setDate(new_date);
  }
  yearChanged = (ev) => {
    const new_year = parseInt(ev.target.value);
    this.setState({year: ev.target.value});
    if (this.isValidYear(new_year)) {
      const new_date = this.state.date.clone().year(new_year);
      this.setDate(new_date);
    }
  }
  setDate(date:moment.Moment) {
    log.info('setDate', date && date.format());
    this.props.onChange(date);
    this.setState({
      date,
      year: date.year().toString(),
    });
  }
}


interface ConfirmerProps {
  timeout?: number;
  first: JSX.Element;
  second: JSX.Element;
}
export class Confirmer extends React.Component<ConfirmerProps, {
  clicked: boolean;
}> {
  private timer;
  constructor(props) {
    super(props);
    this.state = {
      clicked: false,
    }
  }
  render() {
    let { first, second } = this.props;
    if (!this.state.clicked) {
      return React.cloneElement(first, {
        onClick: this.firstClick,
      });
    } else {
      return React.cloneElement(second, {
        onClick: (ev) => {
          this.revert();
          return second.props.onClick(ev);
        }
      })
    }
  }
  firstClick = () => {
    this.timer = setTimeout(this.revert, this.props.timeout || 5000);
    this.setState({clicked: true});
  }
  revert = () => {
    this.setState({clicked: false});
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = null;
  }
}