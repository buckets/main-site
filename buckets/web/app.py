from flask import Blueprint, g, url_for, abort, request
from flask import redirect, render_template

from buckets.web.util import is_pin_expired, clear_pin_expiration


blue = Blueprint('app', __name__)

@blue.before_request
def checkauth():
    if not g.user:
        redirect('/')
    if not request.path.startswith('/maybe-signout') \
        and not request.path.startswith('/pin') \
        and is_pin_expired():
        redirect('/pin')


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


@blue.route('/pin', methods=['GET'])
def pin():
    return 'Your PIN has expired, maybe?'

@blue.route('/maybe-signout', methods=['GET'])
def maybe_signout():
    clear_pin_expiration()
    return render_template('app/maybe_signout.html')
