import * as React from 'react';
import * as moment from 'moment';
import * as cx from 'classnames';
import { sss } from './i18n'

const tzoffset = (new Date()).getTimezoneOffset();

export function ensureUTCMoment(x:Timestamp):moment.Moment {
  if (moment.isMoment(x)) {
    return x.clone().utc()
  } else {
    return moment.utc(x)
  }
}
export function ensureLocalMoment(x:Timestamp):moment.Moment {
  if (moment.isMoment(x)) {
    return x.clone().utcOffset(tzoffset)
  } else {
    return moment(x).utcOffset(tzoffset)
  } 
}
export function serializeTimestamp(x:Timestamp):string {
  if (typeof x === 'string') {
    return x;
  } else {
    return x.toISOString();
  }
}
export function ts2db(x:Timestamp):string {
  return ensureUTCMoment(x).format('YYYY-MM-DD HH:mm:ss');
}
export function tsfromdb(x:Timestamp):moment.Moment {
  return ensureUTCMoment(x);
}

export function localNow() {
  return moment().utcOffset(tzoffset);
}
export function makeLocalDate(year:number, month:number, day:number) {
  return localNow().year(year).month(month).date(day).startOf('day');
}
export function parseLocalTime(...args) {
  return moment(...args).utcOffset(tzoffset);
}
export function utcNow() {
  return moment.utc();
}
export function utcToLocal(d:Timestamp) {
  if (moment.isMoment(d)) {
    return d.clone().utcOffset(tzoffset);
  } else {
    return moment.utc(d).utcOffset(tzoffset);
  }
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

interface DateDisplayProps {
  value: string|moment.Moment;
  className?: string;
  format?: string;
}
export class DateDisplay extends React.Component<DateDisplayProps, any> {
  render() {
    let { value, className, format, ...rest } = this.props;
    format = format || 'll';
    let mom:moment.Moment = ensureUTCMoment(value);
    let display = utcToLocal(mom).format(format);
    if (!mom.isValid()) {
      display = '';
    }
    let cls = cx(className, 'date');
    return <span className={cls} {...rest}>{display}</span>
  }
}

export class DateTime extends React.Component<DateDisplayProps, any> {
  render() {
    let { value, ...rest } = this.props;
    return <DateDisplay
      value={value}
      format="lll"
      {...rest} />
  }
}

interface DateInputProps {
  // UTC time
  value: string|moment.Moment;
  onChange: (val:moment.Moment)=>void;
}
export class DateInput extends React.Component<DateInputProps, {value:moment.Moment}> {
  constructor(props) {
    super(props)
    this.state = {
      value: ensureUTCMoment(props.value),
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState({value: ensureUTCMoment(nextProps.value)});
  }
  render() {
    let value = ensureLocalMoment(this.state.value).format('YYYY-MM-DD');
    return <input type="date" value={value} onChange={this.onChange} />
  }
  onChange = (ev) => {
    let newval = parseLocalTime(ev.target.value).utc()
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
  clipEnd?: boolean,
}):Interval[] {
  let ret = [];
  args.unit = args.unit || 'month';
  args.step = args.step || 1
  let p = args.start.clone()
  let done = false;
  while (p.isBefore(args.end) && !done) {
    let er = p.clone().add(args.step as any, args.unit);
    if (args.clipEnd && er.isAfter(args.end)) {
      er = args.end.clone();
      done = true;
    }
    ret.push({
      start: p.clone(),
      end: er.clone(),
    })
    p = er;
  }
  return ret;
}
