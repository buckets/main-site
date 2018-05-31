import * as React from 'react';
import * as moment from 'moment-timezone';
import * as cx from 'classnames';
import { sss } from './i18n'

import { Day, localDay2moment, utcToLocal, parseUTCTime, parseLocalTime } from 'buckets-core/dist/time'


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
  value: Day;
  onChange: (val:Day)=>void;
}
export class DateInput extends React.Component<DateInputProps, {}> {
  render() {
    const { value } = this.props;
    const stringval = value ? localDay2moment(value).format('YYYY-MM-DD') : '';
    return <input
      type="date"
      value={stringval}
      onChange={this.onChange}
    />
  }
  onChange = (ev) => {
    const stringval:string = ev.target.value;
    let newval:Day = null;
    if (stringval) {
      const [year, month, day] = stringval.split('-');
      newval = {
        type: 'buckets-day',
        year: Number(year),
        month0jan: Number(month)-1,
        day: Number(day),
      }
    }
    this.props.onChange(newval);
  }
}
