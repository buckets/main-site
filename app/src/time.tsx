import * as React from 'react';
import * as moment from 'moment';
import * as cx from 'classnames';

export function ensureUTCMoment(x:Timestamp):moment.Moment {
  if (moment.isMoment(x)) {
    return x.utc()
  } else {
    return moment.utc(x)
  }
}
export function ts2db(x:Timestamp):string {
  return ensureUTCMoment(x).format('YYYY-MM-DD HH:mm:ss');
}

export function isBetween(x:Timestamp, start:Timestamp, end:Timestamp):boolean {
  x = ensureUTCMoment(x)
  start = ensureUTCMoment(start)
  end = ensureUTCMoment(end)
  return x.isSameOrAfter(start) && x.isBefore(end);
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