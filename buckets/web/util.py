from uuid import uuid4

from flask import current_app
from flask import request, g

import structlog
logger = structlog.get_logger()


#----------------------------------------------------------------------
# Logging
#----------------------------------------------------------------------
def get_remote_addr():
    return request.headers.get('Cf-Connecting-Ip') \
        or request.headers.get('X-Client-Ip') \
        or request.remote_addr

def send_warnings_to_sentry(_logger, method, event_dict):
    """
    A processor for structlog that will send warnings to sentry.
    """
    try:
        sentry = current_app.extensions['sentry']
    except (AttributeError, IndexError, RuntimeError):
        return event_dict

    if method == 'warning':
        sentry.client.captureMessage(event_dict.get('event', 'WARNING'),
            extra=event_dict, level='warning')

    return event_dict


def structlog_context():
    """
    Return a dictionary of the current request-related stuff to log
    with structlog.

    Use like this:

        logger.new(**structlog_context())

    or use logger.bind instead of logger.new
    """
    if 'reqid' not in g:
        g.reqid = str(uuid4())
    ret = {
        'reqid': g.reqid,
        'path': request.path,
        'ip': get_remote_addr(),
    }
    return ret

def sentry_context():
    """
    Return a dictionary of the current request-related context
    for sentry to use in logging.

    Use like this:

        sentry.client.context.merge(sentry_context())
    """
    if 'reqid' not in g:
        g.reqid = str(uuid4())
    ip = get_remote_addr()
    user_context = {
        'ip_address': ip,
    }
    extra_context = {
        'ip_address': ip,
    }
    return {
        'user': user_context,
        'extra': extra_context,
    }

