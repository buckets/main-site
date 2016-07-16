from flask import Blueprint, g, url_for, abort
from flask import redirect

blue = Blueprint('app', __name__)

@blue.route('/')
def index():
    farms = g.api.user.list_farms(user_id=g.user['id'])
    if not farms:
        return redirect(url_for('.farms'))
    elif len(farms) > 1:
        # in the future, redirect to last used
        return redirect(url_for('.farms'))
    else:
        return redirect(url_for('budget.index', farm_id=farms[0]['id']))

@blue.route('/farms', methods=['GET'])
def farms():
    abort(500)
