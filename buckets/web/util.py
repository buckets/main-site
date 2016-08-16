from flask import session
from decimal import Decimal
from datetime import datetime
import sys
import json
import time

import structlog
logger = structlog.get_logger()

PIN_LIFETIME = 30 * 60

def bump_pin_expiration():
    """
    This assumes that you have already verified that the user has correctly
    entered their PIN.

    Bump the pin expiration so that they have more time.
    """
    logger.info('bump_pin_expiration')
    session['pin_expiration'] = int(time.time()) + PIN_LIFETIME

def clear_pin_expiration():
    logger.info('clear_pin_expiration')
    session.pop('pin_expiration', 0)

def is_pin_expired():
    """
    Return True if the PIN entry has expired.
    """
    logger.info('is_pin_expired', exp=session.get('pin_expiration', 0))
    return session.get('pin_expiration', 0) < time.time()


def fmtMoney(xint, show_decimal=False, truncate=False):
    sys.stdout.flush()
    xint = xint or 0
    d = Decimal('{0}'.format(xint)) / 100
    ret = '{:,}'.format(d)
    if '.' not in ret:
        ret += '.00'
    fore, aft = ret.split('.', 1)
    if len(aft) != 2:
        ret = '{0}.{1}'.format(fore, (aft + '00')[:2])
    if (ret.endswith('.00') and not show_decimal) or truncate:
        ret = ret.split('.')[0]
    return ret

def fmtDate(d):
    r = d.isoformat()
    if 'T' in r:
        r = r.split('T')[0]
    return r

def fmtMonth(d):
    if not d:
        return ''
    if isinstance(d, str):
        d = datetime.strptime(d, '%Y-%m-%d')
    try:
        return d.strftime('%b %Y')
    except:
        return None


def parseMoney(s):
    s = (s or '0').replace(',', '')
    d = Decimal(s)
    return int(d * 100)


def _customEncoder(obj):
    try:
        return obj.isoformat()
    except:
        raise TypeError('%r is not JSON serializeable' % (obj,))


def toJson(thing):
    return json.dumps(thing, default=_customEncoder)



all_filters = {
    'money': fmtMoney,
    'json': toJson,
    'date': fmtDate,
    'month': fmtMonth,
}
