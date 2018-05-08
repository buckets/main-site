import * as math from 'mathjs';
// import { PrefixLogger } from './logging'
// const log = new PrefixLogger('(money)');

export interface ISeps {
  group: string;
  group_regex: RegExp;
  decimal: string;
  decimal_regex: RegExp;
}
export let SEPS:ISeps = {
  group: null,
  decimal: null,
  group_regex: null,
  decimal_regex: null,
}

export function setSeparators(new_seps:ISeps) {
  Object.assign(SEPS, new_seps)
}
setSeparators({
  group: ',',
  group_regex: /,/g,
  decimal: '.',
  decimal_regex: /\./g,
});

math.config({
  number: 'BigNumber',
  precision: 64,
})
export function fancyEval(x:string) {
  // convert from whatever locale it's in to en_us
  // without thousand seps
  x = x
    .replace(SEPS.group_regex, '')
    .replace(SEPS.decimal_regex, '.');
  return math.eval(x)
    .toString()
    .replace(/\./g, SEPS.decimal);
}


let DEFAULT = {
  symbol: '',
}
export function setDefaultSymbol(symbol:string) {
  DEFAULT.symbol = symbol;
}


export function cents2decimal(cents:number|null|string, args:{
    show_decimal?:boolean,
    show_sep?:boolean,
    round?:boolean,
  } = {}):string {
  if (cents === null || cents === undefined || cents === '') {
    return null;
  }
  if (cents === Infinity) {
    return '∞'
  }
  let { show_decimal, show_sep, round } = args;
  if (show_decimal === undefined) {
    show_decimal = false;
  }
  if (show_sep === undefined) {
    show_sep = true;
  }
  if (typeof cents === 'string') {
    cents = parseInt(cents);
  }
  if (round) {
    cents = cents - cents % 100;
  }
  var x = Math.abs(Math.round(cents));
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
    stem = parts.join(SEPS.group);
  }

  // After decimal
  var r = (x % 100);
  var suffix = '';
  if (r || show_decimal) {
    var suffix = r.toString();
    if (suffix.length < 2) {
      suffix = '0' + suffix;
    }
    suffix = SEPS.decimal + suffix;
  }
  return sign + stem + suffix;
}

export function decimal2cents(string:string, opts:{
  seps?: Partial<ISeps>
}={}):number {
  const seps:ISeps = Object.assign({}, SEPS, opts.seps || {});
  string = string.trim();

  var negative = false;
  if (string.length && string[0] === '-') {
    string = string.substr(1);
    negative = true;
  }

  string = string.replace(seps.group_regex, '');
  var parts = string.split(seps.decimal);

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
