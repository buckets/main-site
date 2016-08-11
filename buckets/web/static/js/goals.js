function parseMonth(s) {
  if (s instanceof Date) {
    return s;
  } else if (!s) {
    return null;
  }
  var parts = s.split('-');
  if (parts.length > 3 || parts.length < 2) {
    return null;
  }
  var year = parseInt(parts[0]);
  var m = parseInt(parts[1]) - 1;
  if (m < 0 || m > 11) {
    return null;
  }
  return new Date(year, m, 1);
}
function parseDate(s) {
  if (s instanceof Date) {
    return s;
  } else if (!s) {
    return null;
  }
  var parts = s.split('-');
  if (parts.length > 3 || parts.length < 2) {
    return null;
  }
  var year = parseInt(parts[0]);
  var m = parseInt(parts[1]) - 1;
  if (m < 0 || m > 11) {
    return null;
  }
  var d = parseInt(parts[2]);
  return new Date(year, m, d);
}
function _zeropad(x, n) {
  while (x.length < n) {
    x = '0' + x;
  }
  return x;
}
function formatDate(d) {
  if (!d) {
    return null;
  }
  var y = '' + d.getFullYear();
  var m = '' + (d.getMonth() + 1);
  var d = '' + (d.getDate());
  return y + '-' + _zeropad(m, 2) + '-' + _zeropad(d, 2);
}
function formatMonth(d) {
  if (!d) {
    return null;
  }
  return d.toLocaleDateString(navigator.language,
    {month: 'short', year: 'numeric'})
}
function _date2months(d) {
  return d.getFullYear() * 12 + d.getMonth()
}
function _months2date(m) {
  var months = m % 12;
  var year = (m - months) / 12;
  return new Date(year, months, 1);
}
function monthsBetween(start, end) {
  return _date2months(end) - _date2months(start);
}
function addMonths(start, months) {
  return _months2date(_date2months(start) + months);
}



function _computeDeposit(goal, balance, end_date, today) {
  console.log('deposit-->', goal, balance, end_date, today);
  today = today || new Date();

  // compute deposit
  var amount_left = goal - balance;
  if (amount_left <= 0) {
    console.log('  ->', 0);
    return 0;
  }

  var months_left = monthsBetween(today, end_date);
  if (months_left <= 0) {
    console.log('  ->', amount_left);
    return amount_left;
  }

  var ret = Math.ceil(amount_left / months_left);
  console.log('  ->', ret);
  return ret;
}

function _computeEndDate(goal, balance, deposit, today) {
  today = parseMonth(today || new Date());

  if (goal === null) {
    return null;
  }
  var amount_left = goal - balance;
  if (amount_left <= 0) {
    return today;
  } else {
    var months_needed = Math.ceil(amount_left / deposit);
    if (months_needed === Infinity) {
      return null;
    } else {
      return addMonths(today, months_needed);
    }
  }
}
function _computeGoal(balance, deposit, end_date, today) {
  today = parseMonth(today || new Date());
  end_date = parseMonth(end_date);

  if (deposit === null || !end_date) {
    return null;
  }
  var months_left = monthsBetween(today, end_date);
  var amount = Math.ceil(deposit * months_left);
  return balance + amount;
}

function computeBucketDeposit(data) {
  var ret = {
    deposit: null,
    goal: null,
    goal_percent: null,
    end_date: null,
  };

  var today = parseMonth(data.today) || new Date();

  if (data.kind === 'deposit') {
    // deposit
    ret.deposit = data.deposit;
  } else if (data.kind === 'goal') {
    // goal
    ret.goal = data.goal;
    ret.end_date = parseMonth(data.end_date);
    ret.deposit = data.deposit;

    if (ret.goal === 0 || ret.goal === null) {
      ret.goal = _computeGoal(data.balance, data.deposit, data.end_date, today);
    } else if (ret.end_date === null || ret.end_date === '') {
      ret.deposit = data.deposit;
      ret.end_date = _computeEndDate(data.goal, data.balance, data.deposit, today);
    } else {
      ret.deposit = _computeDeposit(data.goal, data.balance, ret.end_date, today);
    }

    if (ret.goal) {
      ret.goal_percent = 100 * data.balance / ret.goal;
      ret.goal_percent = ret.goal_percent > 100 ? 100 : (ret.goal_percent < 0 ? 0 : ret.goal_percent);  
    } else {
      ret.goal_percent = null;
    }
    if (ret.end_date) {
      ret.end_date = formatDate(ret.end_date);
    }
  }
  return ret;
};
