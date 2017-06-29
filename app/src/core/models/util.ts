import * as moment from 'moment';

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

export type Timestamp = string | moment.Moment;