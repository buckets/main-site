var thousand_sep = ',';
var decimal_sep = '.';

function cents2decimal(cents, show_decimal, show_sep) {
  if (cents === null || _.isUndefined(cents) || cents === '') {
    return null;
  }
  if (_.isUndefined(show_decimal)) {
    show_decimal = false;
  }
  if (_.isUndefined(show_sep)) {
    show_sep = true;
  }
  var x = Math.abs(cents);
  if (isNaN(x)) {
    x = 0;
    cents = 0;
  }
  var sign = cents < 0 ? '-' : '';

  // Before decimal
  var d = (parseInt(x / 100)).toString();
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
    stem = parts.join(thousand_sep);
  }

  // After decimal
  var r = (x % 100);
  var suffix = '';
  if (r || show_decimal) {
    var suffix = r.toString();
    if (suffix.length < 2) {
      suffix = '0' + suffix;
    }
    suffix = decimal_sep + suffix;
  }
  return sign + stem + suffix;
}

function decimal2cents(string) {
  string = string.trim();

  var negative = false;
  if (string.length && string[0] === '-') {
    string = string.substr(1);
    negative = true;
  }

  var re = new RegExp(thousand_sep, 'g');
  string = string.replace(re, '');
  var parts = string.split(decimal_sep);

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