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
 *
 * Use like this:
 *
 * onChange={debounceOnChange(
 *    ev => ev.target.value,
 *    value => { console.log('value', value) }
 * )}
 */
export function debounceOnChange(mapper:Function, actor:Function) {
  let debounced = _.debounce(actor, 250, {leading: false, trailing: true});
  return (...args) => {
    return debounced(mapper(...args));
  }
}


interface DebouncedInputProps {
  value: any;
  element?: string|any;
  changeArgIsValue?: boolean;
  onChange: (newval:any)=>void;
  blendin?: boolean;
  [k:string]: any;
}
export class DebouncedInput extends React.Component<DebouncedInputProps, {
  value: any;
}> {
  private propChangesInFlight = 0;
  private stateChangedSinceProps = false;

  constructor(props) {
    super(props)
    this.state = {
      value: props.value,
    }
  }
  componentWillReceiveProps(nextProps) {
    this.propChangesInFlight -= 1;
    if (nextProps.value !== this.state.value && this.propChangesInFlight <= 0 && !this.stateChangedSinceProps) {
      this.setState({value: nextProps.value});
    }
    this.stateChangedSinceProps = false;
    if (this.propChangesInFlight < 0) {
      this.propChangesInFlight = 0;
    }
  }
  onChange = (ev) => {
    let val = this.props.changeArgIsValue ? ev : ev.target.value;
    if (val !== this.state.value) {
      if (this.propChangesInFlight) {
        this.stateChangedSinceProps = true;
      }
      this.setState({value: val}, () => {
        this.emitChange();
      })
    }
  }
  emitChange = debounceChange(() => {
    this.propChangesInFlight += 1;
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

interface ClickToEditProps {
  value: string;
  placeholder: string;
  onChange: (newval:string)=>void;
}
interface ClickToEditState {
  editing: boolean;
  saving: boolean;
  cursor: number;
  value: string;
}
export class ClickToEdit extends React.Component<ClickToEditProps, ClickToEditState> {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      saving: false,
      cursor: null,
      value: props.value,
    }
  }
  componentWillReceiveProps(nextProps:ClickToEditProps) {
    this.setState({value: nextProps.value, saving: false})
  }
  render() {
    let { value, placeholder } = this.props;
    let { editing, saving } = this.state;
    if (saving) {
      // to prevent flicker
      value = this.state.value;
    }
    let guts;
    if (editing) {
      guts = <div className="wrap">
        <input
          className={cx("ctx-matching-input")}
          value={this.state.value}
          placeholder={placeholder}
          onChange={(ev) => {
            this.setState({value: ev.target.value});
          }}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              this.save();
            } else if (ev.key === 'Escape') {
              ev.preventDefault();
              this.close();
            }
          }}
          ref={elem => {
            if (elem) {
              setTimeout(() => {
                if (this.state.cursor !== null) {
                  elem.setSelectionRange(this.state.cursor, this.state.cursor);
                  elem.focus()
                  this.setState({cursor: null})
                }
              }, 0)
            }
          }}
        />
        <button className="icon" onClick={this.save}><span className="fa fa-check" /></button>
        <button className="icon" onClick={this.close}><span className="fa fa-close" /></button>
      </div>
    } else {
      guts = value || placeholder;
    }
    return <div
      className={cx("click-to-edit", {
        'editing': editing,
      })}
      onClick={this.onClick}>
      {guts}
    </div>
  }
  onClick = (ev) => {
    if (!this.state.editing) {
      let s = window.getSelection();
      let range = s.getRangeAt(0);
      this.setState({editing: true, cursor: range.startOffset})
    }
  }
  save = () => {
    this.setState({editing: false, saving: true}, () => {
      this.props.onChange(this.state.value);
    })
  }
  close = () => {
    this.setState({editing: false});
  }
}

const LEFT_ARROW = '\u25c0'
const RIGHT_ARROW = '\u25b6'

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (args:{month:number,year:number})=>void;
  className?: string;
}
export class MonthSelector extends React.Component<MonthSelectorProps, {
  month: number;
  year: string;
}> {
  private minyear = 1900;
  constructor(props:MonthSelectorProps) {
    super(props);
    this.state = {
      month: props.month,
      year: props.year.toString(),
    }
  }
  componentWillReceiveProps(nextProps:MonthSelectorProps) {
    this.setState({
      month: nextProps.month,
      year: nextProps.year.toString(),
    })
  }
  render() {
    let { className } = this.props;
    let month_names = moment.monthsShort();
    let current_month = this.state.month;
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
      let new_month = this.state.month + amount;
      let new_year = this.props.year;
      while (new_month < 0) {
        new_year -= 1;
        new_month += 12;
      }
      while (new_month >= 12) {
        new_year += 1;
        new_month -= 12;
      }
      log.info('new', new_month, new_year);
      this.setDate({month: new_month, year:new_year});
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
    log.info('monthChanged', ev.target.value);
    const new_month = parseInt(ev.target.value);
    this.setDate({
      month: new_month,
      year: this.props.year,
    });
  }
  yearChanged = (ev) => {
    log.info('yearChanged', ev.target.value);
    const new_year = parseInt(ev.target.value);
    this.setState({year: ev.target.value});
    if (this.isValidYear(new_year)) {
      this.setDate({
        month: this.state.month,
        year: new_year,
      });
    }
  }
  setDate(args:{month:number, year:number}) {
    log.info('setDate', args);
    this.props.onChange(args);
    this.setState({
      month: args.month,
      year: args.year.toString(),
    });
  }
}


interface SafetySwitchProps {
  timeout?: number;
  disabled?: boolean;
  onClick?: (ev)=>void;
  className?: string;
  coverClassName?: string;
}
export class SafetySwitch extends React.Component<SafetySwitchProps, {
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
    let { children, className, coverClassName, disabled, onClick } = this.props;
    return <div
      onClick={ev => {
        if (disabled) {
          ev.preventDefault();
          return;
        }
        if (this.state.clicked) {
          this.setState({clicked: false});
          onClick && onClick(ev);
        } else {
          this.open();
        }
      }}
      className={cx(
        "safety-switch",
        {
          open: this.state.clicked,
        }
      )}>
      <button
        disabled={disabled}
        className={cx(
          className,
          "under delete", {
            pulse: this.state.clicked
        })}>{children}</button>
      <button
        disabled={disabled}
        className={cx(
          className,
          coverClassName,
          "cover")
        }>{children}</button>
    </div>
  }
  open = () => {
    this.timer = setTimeout(this.revert, this.props.timeout || 5000);
    this.setState({clicked: true});
  }
  revert = () => {
    this.setState({clicked: false});
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = null;
  }
}