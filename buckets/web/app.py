from flask import Blueprint, g, url_for, abort, request
from flask import redirect, render_template, flash, session

from buckets.error import VerificationError
from buckets.web.util import is_pin_expired, clear_pin_expiration
from buckets.web.util import bump_pin_expiration, ask_for_pin

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
    if endpoint in _no_pin_required:
        pass
    else:
        if is_pin_expired():
            return ask_for_pin()
        else:
            bump_pin_expiration()


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
@blue.route('/pin', methods=['GET', 'POST'])
def pin():
    if g.api.user.has_pin(user_id=g.user['id']):
        if request.method == 'POST':
            pin = request.form.get('pin', '')
            try:
                g.api.user.verify_pin(user_id=g.user['id'], pin=pin)
                bump_pin_expiration()
                flash('You are signed in.')
                url = session.get('url_after_pin', '/')
                return redirect(url)
            except VerificationError:
                flash('Wrong PIN.', 'error')
                # XXX count wrong pin entries
        return render_template('app/pin_entry.html')
    else:
        return redirect(url_for('.set_pin'))

@dont_require_pin
@blue.route('/pin/set', methods=['GET', 'POST'])
def set_pin():
    previous_pin = request.form.get('previous_pin', '')
    if request.method == 'POST':
        given = request.form.get('pin', '')
        if len(given) != 4:
            flash('Your PIN must be 4 digits', 'error')
            previous_pin = None
        else:
            if previous_pin:
                if previous_pin == given:
                    # success set pin
                    g.api.user.set_pin(user_id=g.user['id'], pin=given)
                    flash('Your PIN is set.')
                    return redirect(url_for('.pin'))
                else:
                    flash("The PINs didn't match.", 'error')
                    previous_pin = None
            else:
                # entered first pin
                previous_pin = given
    return render_template('app/pin_create.html',
        previous_pin=previous_pin)

@dont_require_pin
@blue.route('/maybe-signout', methods=['GET'])
def maybe_signout():
    clear_pin_expiration()
    return render_template('app/maybe_signout.html')
