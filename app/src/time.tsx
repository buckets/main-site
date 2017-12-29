import * as React from 'react';
import * as moment from 'moment';
import * as cx from 'classnames';
import { sss } from './i18n'

export function ensureUTCMoment(x:Timestamp):moment.Moment {
  if (moment.isMoment(x)) {
    return x.utc().clone()
  } else {
    return moment.utc(x)
  }
}
export function ensureLocalMoment(x:Timestamp):moment.Moment {
  if (moment.isMoment(x)) {
    return x.local().clone()
  } else {
    return moment(x)
  } 
}
export function serializeTimestamp(x:Timestamp):string {
  if (typeof x === 'string') {
    return x;
  } else {
    return x.format('YYYY-MM-DD HH:mm:ss');
  }
}
export function ts2db(x:Timestamp):string {
  return ensureUTCMoment(x).format('YYYY-MM-DD HH:mm:ss');
}
export function tsfromdb(x:Timestamp):moment.Moment {
  return ensureUTCMoment(x);
}

export function isBetween(x:Timestamp, start:Timestamp, end:Timestamp):boolean {
  x = ensureUTCMoment(x)
  start = ensureUTCMoment(start)
  end = ensureUTCMoment(end)
  return x.isSameOrAfter(start) && x.isBefore(end);
}

export class PerMonth extends React.Component<{}, {}> {
  render() {
    return <span className="permonth">{sss('/mo')}</span>
  }
}

export type Timestamp = string | moment.Moment;

interface DateProps {
  value: string|moment.Moment;
  className?: string;
  format?: string;
}
export class Date extends React.Component<DateProps, any> {
  render() {
    let { value, className, format, ...rest } = this.props;
    format = format || 'll';
    let mom:moment.Moment;
    if (!moment.isMoment(value)) {
      mom = moment.utc(value);
    } else {
      mom = value;
    }
    let display = mom.local().format(format);
    if (!mom.isValid()) {
      display = '';
    }
    let cls = cx(className, 'date');
    return <span className={cls} {...rest}>{display}</span>
  }
}

export class DateTime extends React.Component<DateProps, any> {
  render() {
    let { value, ...rest } = this.props;
    return <Date
      value={value}
      format="lll"
      {...rest} />
  }
}

interface DateInputProps {
  value: string|moment.Moment;
  onChange: (val:moment.Moment)=>void;
}
export class DateInput extends React.Component<DateInputProps, {value:moment.Moment}> {
  constructor(props) {
    super(props)
    this.state = {
      value: moment.utc(props.value),
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState({value: moment.utc(nextProps.value)});
  }
  render() {
    let value = this.state.value.local().format('YYYY-MM-DD');
    return <input type="date" value={value} onChange={this.onChange} />
  }
  onChange = (ev) => {
    let newval = moment(ev.target.value).utc()
    this.setState({value: newval})
    this.props.onChange(newval)
  }
}

export interface Interval {
  start: moment.Moment,
  end: moment.Moment,
}

export function chunkTime(args: {
  start: moment.Moment,
  end: moment.Moment,
  unit?: string,
  step?: number,
}):Interval[] {
  let ret = [];
  args.unit = args.unit || 'month';
  args.step = args.step || 1
  let p = args.start.clone()
  while (p.isSameOrBefore(args.end)) {
    let er = p.clone().add(args.step as any, args.unit);
    ret.push({
      start: p.clone(),
      end: er.clone(),
    })
    p = er;
  }
  return ret;
}
