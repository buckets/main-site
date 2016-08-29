from flask import session, request, redirect, url_for, g
from decimal import Decimal
from datetime import datetime
import sys
import json
import time
from functools import wraps

from jose import jwt

import structlog
logger = structlog.get_logger()

from buckets.error import Forbidden

PIN_LIFETIME = 30 * 60

def bump_pin_expiration():
    """
    This assumes that you have already verified that the user has correctly
    entered their PIN.

    Bump the pin expiration so that they have more time.
    """
    session['pin_expiration'] = int(time.time()) + PIN_LIFETIME

def clear_pin_expiration():
    session.pop('pin_expiration', 0)

def get_pin_expiration():
    return session.get('pin_expiration', 0)

def is_pin_expired():
    """
    Return True if the PIN entry has expired.
    """
    return session.get('pin_expiration', 0) < time.time()

def ask_for_pin():
    """
    Redirect to ask for pin and then come back.
    """
    if request.method == 'GET':
        session['url_after_pin'] = request.url
    return redirect(url_for('app.pin'))


#----------------------------------------------------------------------
# Post-response processing
#----------------------------------------------------------------------

def enable_after_response(app):
    """
    Enable the use of after_response(...) on an app.
    """
    from crochet import wait_for, run_in_reactor, setup
    setup()

    @app.after_request
    def after_request():
        try:
            for func,args,kwargs in g.get('_after_response_funcs', []):
                
                try:
                    func(*args, **kwargs)
                except Exception as e:
                    logger.error('Error running after_response func')
                    logger.exception(e)
        except Exception as e:
            logger.error('Error in after_response')
            logger.exception(e)


def after_response(func, *args, **kwargs):
    """
    Register a function to be run after the response is sent
    to a client.
    """
    if '_after_response_funcs' not in g:
        g._after_response_funcs = []
    g._after_response_funcs.append((func, args, kwargs))


#----------------------------------------------------------------------
# CSRF
#----------------------------------------------------------------------

class CSRF(object):

    def __init__(self, secret=None, lifespan=30*60):
        """
        @param secret: The secret used to sign the jwt.
        @param lifespan: Seconds the tokens will last.
        """
        self.secret = secret
        self.lifespan = lifespan

    def create_csrf(self, user_id):
        if self.secret is None:
            raise Exception('CSRF secret not configured')
        iat = int(time.time())
        exp = iat + self.lifespan
        return jwt.encode({
            'user_id': user_id,
            'iat': iat,
            'nbf': iat-60,
            'exp': exp,
        }, self.secret, algorithm='HS256')

    def verify_csrf(self, user_id, token):
        if self.secret is None:
            raise Exception('CSRF secret not configured')
        data = jwt.decode(token, self.secret,
            algorithms=['HS256'])
        if data.get('user_id') != user_id:
            raise Forbidden("Invalid CSRF Token")

    def csrf_input(self):
        from flask import g, current_app
        return current_app.jinja_env.filters['safe']('<input type="hidden" name="_csrf" value="{0}">'.format(
            self.create_csrf(g.user_id)))

    def require_csrf(self, func):
        """
        Decorator for flask endpoint that enforces CSRF for non-GET/HEAD/OPTIONS
        """
        from flask import g, request
        @wraps(func)
        def deco(*args, **kwargs):
            if request.method not in ['GET', 'OPTIONS', 'HEAD']:
                try:
                    token = request.headers.get('CSRF', request.values.get('_csrf', None))
                except Exception:
                    raise Forbidden('No CSRF token supplied')
                try:
                    self.verify_csrf(g.user_id, token)
                except Exception:
                    logger.error('Error verifying csrf')
                    raise
                except Forbidden:
                    raise
            return func(*args, **kwargs)
        return deco

GLOBAL_CSRF = CSRF()
require_csrf = GLOBAL_CSRF.require_csrf

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
all_globals = {
    'create_csrf': GLOBAL_CSRF.create_csrf,
    'csrf_input': GLOBAL_CSRF.csrf_input,
}
