from flask import Blueprint, g, render_template, url_for, redirect

blue = Blueprint('farm', __name__, url_prefix='/farm/<int:farm_id>')

@blue.url_value_preprocessor
def pull_farm_id(endpoint, values):
    g.farm_id = values.pop('farm_id')

@blue.url_defaults
def add_farm_id(endpoint, values):
    if 'farm_id' in g:
        values.setdefault('farm_id', g.farm_id)


@blue.route('/')
def index():
    return redirect(url_for('.summary'))

@blue.route('/summary')
def summary():
    return render_template('farm/summary.html')

@blue.route('/accounts')
def accounts():
    return render_template('farm/accounts.html')

@blue.route('/buckets')
def buckets():
    return render_template('farm/buckets.html')

@blue.route('/transactions')
def transactions():
    return render_template('farm/transactions.html')

@blue.route('/reports')
def reports():
    return render_template('farm/reports.html')

