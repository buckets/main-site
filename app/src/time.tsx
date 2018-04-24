import * as React from 'react';
import * as moment from 'moment-timezone';
import * as cx from 'classnames';
import { sss } from './i18n'
import { PrefixLogger } from './logging'

const mytz = moment.tz.guess();
const log = new PrefixLogger('(time)');


/**
 *  Ensure that a moment returns isUTC() === true
 */
export function ensureUTCMoment(x:moment.Moment):moment.Moment {
  return x.clone().tz('UTC');
}

/**
 *  Ensure that a moment returns isUTC() === false
 */
export function ensureLocalMoment(x:moment.Moment):moment.Moment {
  return x.clone().tz(mytz);
}

/**
 *  Serialize a timestamp for sending across a wire
 */
export function dumpTS(x:MaybeMoment):SerializedTimestamp {
  if (isSerializedTimestamp(x)) {
    return x;
  } else {
    return {
      type: 'bucket-ts',
      value: x.valueOf(),
      tz: x.tz(),
    }
  }
}
/**
 *  Deserialize/inflate a timestamp that was serialized across a wire
 */
export function loadTS(x:MaybeMoment):moment.Moment {
  if (isSerializedTimestamp(x)) {
    return moment.tz(x.value, x.tz);
  } else {
    return x;
  }
}
export function isSerializedTimestamp(x:any):x is SerializedTimestamp {
  return x.type === 'bucket-ts' && x.value !== undefined && x.tz !== undefined;
}
export interface SerializedTimestamp {
  type: 'bucket-ts';
  value: number;
  tz: string;
}
export type MaybeMoment =
  | SerializedTimestamp
  | moment.Moment;

/**
 *  Convert a moment to UTC string suitable for DB
 */
export function ts2utcdb(x:moment.Moment):string {
  return x.tz('UTC').format('YYYY-MM-DD HH:mm:ss');
}
/**
 *  Convert a moment to Local string suitable for DB
 */
export function ts2localdb(x:moment.Moment):string {
  return x.tz(mytz).format('YYYY-MM-DD HH:mm:ss');
}

/**
 *  Convert a UTC time string to moment in THIS timezone
 */
export function parseUTCTime(x:string|moment.Moment):moment.Moment {
  if (moment.isMoment(x)) {
    return x.clone().tz(mytz);
  } else {
    return moment.tz(x, 'UTC').tz(mytz);  
  }
}

/**
 *  Get the current time in THIS timezone
 */
export function localNow():moment.Moment {
  return moment.tz(mytz);
}

/**
 *  Make a moment for a given date that's the start of the
 *  day in THIS timezone
 */
export function makeLocalDate(year:number, month:number, day:number) {
  return localNow().year(year).month(month).date(day).startOf('day');
}

/**
 *  Convert a local time string into a moment in THIS timezone
 */
export function parseLocalTime(...args):moment.Moment {
  return moment(...args).tz(mytz);
}

/**
 *  Get the current time in the UTC timezone.
 */
export function utcNow() {
  return moment.utc();
}

/**
 *  Convert a UTC moment to a moment in THIS timezone
 */
export function utcToLocal(d:moment.Moment) {
  return d.clone().tz(mytz);
}

export function isBetween(x:moment.Moment, start:moment.Moment, end:moment.Moment):boolean {
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

interface DateDisplayProps {
  value: string|moment.Moment;
  islocal?: boolean;
  className?: string;
  format?: string;
}
export class DateDisplay extends React.Component<DateDisplayProps, any> {
  render() {
    let { value, className, islocal, format, ...rest } = this.props;
    format = format || 'll';
    let mom:moment.Moment;
    if (islocal) {
      mom = parseLocalTime(value)
    } else {
      mom = parseUTCTime(value)
    }
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
  value: string|moment.Moment;
  islocal?: boolean;
  onChange: (val:moment.Moment)=>void;
}
export class DateInput extends React.Component<DateInputProps, {value:moment.Moment}> {
  constructor(props:DateInputProps) {
    super(props)
    this.state = {
      value: props.islocal ? parseLocalTime(props.value) : parseUTCTime(props.value),
    }
  }
  componentWillReceiveProps(nextProps:DateInputProps) {
    this.setState({
      value: nextProps.islocal ? parseLocalTime(nextProps.value) : parseUTCTime(nextProps.value),
    });
  }
  render() {
    const value = this.state.value.format('YYYY-MM-DD');
    return <input type="date" value={value} onChange={this.onChange} />
  }
  onChange = (ev) => {
    const newval = this.props.islocal ? parseLocalTime(ev.target.value) : parseUTCTime(ev.target.value);
    log.info(`DateInput.onChange(${ev.target.value}) -> ${newval.format()}/${newval.format('YYYY-MM-DD')}`)
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
