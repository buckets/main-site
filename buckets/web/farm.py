from flask import Blueprint, g, render_template, url_for, redirect
from flask import request, flash
from buckets.budget import BudgetManagement

blue = Blueprint('farm', __name__, url_prefix='/farm/<int:farm_id>')

@blue.url_value_preprocessor
def pull_farm_id(endpoint, values):
    g.farm_id = values.pop('farm_id')

@blue.before_request
def before_request():
    api = BudgetManagement(g.engine, g.farm_id)
    g.farm = api.policy.bindContext(g.auth_context)

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

@blue.route('/accounts', methods=['GET', 'POST'])
def accounts():
    if request.method == 'POST':
        name = request.values['name']
        balance = int(request.values['balance'] or '0')
        g.farm.create_account(name=name, balance=balance)
        flash('Created account')
    accounts = g.farm.list_accounts()
    return render_template('farm/accounts.html',
        accounts=accounts)

@blue.route('/buckets')
def buckets():
    return render_template('farm/buckets.html')

@blue.route('/transactions')
def transactions():
    return render_template('farm/transactions.html')

@blue.route('/reports')
def reports():
    return render_template('farm/reports.html')

