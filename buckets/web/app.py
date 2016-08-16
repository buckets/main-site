from flask import Blueprint, g, url_for, abort, request
from flask import redirect, render_template

from buckets.web.util import is_pin_expired, clear_pin_expiration

import structlog
logger = structlog.get_logger()


blue = Blueprint('app', __name__)

_no_pin_required = []
def dont_require_pin(f):
    _no_pin_required.append(f.__name__)
    return f


@blue.before_request
def checkauth():
    if not g.user:
        return redirect('/')
    endpoint = request.endpoint.split('.')[-1]
    if endpoint not in _no_pin_required and is_pin_expired():
        return redirect(url_for('.pin'))


@blue.route('/')
def index():
    farms = g.api.user.list_farms(user_id=g.user['id'])
    if not farms:
        farm = g.api.user.create_farm(creator_id=g.user['id'])
        farms = [farm]
    
    if len(farms) > 1:
        # in the future, redirect to last used
        return redirect(url_for('.farms'))
    else:
        return redirect(url_for('farm.index', farm_id=farms[0]['id']))

@blue.route('/farms', methods=['GET'])
def farms():
    abort(500)


@dont_require_pin
@blue.route('/pin', methods=['GET'])
def pin():
    return render_template('app/pin_entry.html')

@dont_require_pin
@blue.route('/maybe-signout', methods=['GET'])
def maybe_signout():
    clear_pin_expiration()
    return render_template('app/maybe_signout.html')
