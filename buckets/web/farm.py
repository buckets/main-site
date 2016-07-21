from flask import Blueprint, g, render_template, url_for, redirect
from flask import request, flash, make_response
from buckets.budget import BudgetManagement
from buckets.web.util import parseMoney, toJson


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
        balance = parseMoney(request.values['balance'] or '0')
        g.farm.create_account(name=name, balance=balance)
        flash('Created account')
    accounts = g.farm.list_accounts()
    return render_template('farm/accounts.html',
        accounts=accounts)

@blue.route('/buckets', methods=['GET', 'POST'])
def buckets():
    if request.method == 'POST':
        name = request.values['name']
        bucket = g.farm.create_bucket(name=name)
        flash('Created bucket')
        return redirect(url_for('farm.bucket', bucket_id=bucket['id']))
    groups = g.farm.list_groups()
    buckets = g.farm.list_buckets()
    return render_template('farm/buckets.html',
        groups=groups,
        buckets=buckets)

@blue.route('/buckets/<int:bucket_id>', methods=['GET', 'POST'])
def bucket(bucket_id):
    if request.method == 'POST':
        data = {}
        data['name'] = request.form['name']
        data['kind'] = request.form['kind']
        
        goal = request.form['goal']
        if goal:
            data['goal'] = int(goal)
        else:
            data['goal'] = None

        deposit = request.form['deposit']
        if deposit:
            data['deposit'] = int(deposit)
        else:
            data['deposit'] = None

        end_date = request.form['end_date']
        if end_date:
            data['end_date'] = end_date
        else:
            data['end_date'] = None
        
        g.farm.update_bucket(id=bucket_id, data=data)
        flash('{0} updated'.format(data['name']))
        return redirect(url_for('.buckets'))
    bucket = g.farm.get_bucket(id=bucket_id)
    return render_template('farm/bucket.html',
        bucket=bucket)

@blue.route('/groups', methods=['POST'])
def groups():
    name = request.form['name']
    g.farm.create_group(name=name)
    flash('Group created')
    return redirect(url_for('.buckets'))

@blue.route('/groups/<int:group_id>', methods=['GET', 'POST'])
def group(group_id):
    if request.method == 'POST':
        data = {}
        data['name'] = request.form['name']
        
        g.farm.update_group(id=group_id, data=data)
        flash('{0} updated'.format(data['name']))
        return redirect(url_for('.buckets'))
    group = g.farm.get_group(id=group_id)
    return render_template('farm/group.html',
        group=group)

@blue.route('/transactions')
def transactions():
    buckets = g.farm.list_buckets()
    accounts = g.farm.list_accounts()
    return render_template('farm/transactions.html',
        buckets=buckets,
        accounts=accounts)

@blue.route('/reports')
def reports():
    return render_template('farm/reports.html')


#-----------------------------------------------------------------------
# api
#-----------------------------------------------------------------------

@blue.route('/api', methods=['POST'])
def api():
    data = request.json
    multi = True
    responses = []
    if not isinstance(data, list):
        multi = False
        data = [data]
    
    for item in data:
        method = item['method']
        kwargs = item.get('kwargs', {})
        for key in kwargs:
            # remove private vars
            if key.startswith('_'):
                kwargs.pop(key)
        m = getattr(g.farm, method)
        responses.append(m(**kwargs))
    
    if not multi:
        responses = responses[0]
    r = make_response(toJson(responses))
    r.headers['Content-Type'] = 'application/json'
    return r
