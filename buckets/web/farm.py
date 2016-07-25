from flask import Blueprint, g, render_template, url_for, redirect
from flask import request, flash, make_response, abort
from buckets.budget import BudgetManagement
from buckets.web.util import parseMoney, toJson


blue = Blueprint('farm', __name__, url_prefix='/farm/<int:farm_id>')

@blue.url_value_preprocessor
def pull_farm_id(endpoint, values):
    g.farm_id = values.pop('farm_id')

@blue.before_request
def before_request():
    g.db_transaction = None
    g.db_conn = None
    
    # authorized for this farm?
    farm = g.api.user.get_farm(id=g.farm_id)
    if not farm:
        abort(404)
    if g.user['id'] not in [x['id'] for x in farm['users']]:
        abort(404)

    g.db_conn = g.engine.connect()
    g.db_transaction = g.db_conn.begin()
    api = BudgetManagement(g.db_conn, g.farm_id)
    g.farm = api.policy.bindContext(g.auth_context)

@blue.after_request
def after_request(r):
    if g.db_transaction:
        try:
            g.db_transaction.commit()
        except:
            g.db_transaction.rollback()
            raise
    return r

@blue.url_defaults
def add_farm_id(endpoint, values):
    if 'farm_id' in g:
        values.setdefault('farm_id', g.farm_id)



@blue.before_request
def what_should_show():
    g.show = {
        'connections': g.farm.has_connections(),
        'transactions': False,
        'summary': False,
        'reports': False,
    }
    if g.farm.has_transactions():
        g.show.update({
            'transactions': True,
            'summary': True,
            'reports': True,
        })
    elif g.farm.has_accounts():
        g.show.update({
            'transactions': True,
        })


@blue.route('/')
def index():
    # XXX for now, redirect to accounts
    return redirect(url_for('.accounts'))

@blue.route('/summary')
def summary():
    g.show['summary'] = True
    return render_template('farm/summary.html')

@blue.route('/accounts', methods=['GET', 'POST'])
def accounts():
    if request.method == 'POST':
        name = request.values['name']
        balance = parseMoney(request.values['balance'] or '0')
        g.farm.create_account(name=name, balance=balance)
        flash('Created account')
        return redirect(url_for('farm.accounts'))
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
    g.show['transactions'] = True
    buckets = g.farm.list_buckets()
    accounts = g.farm.list_accounts()
    return render_template('farm/transactions.html',
        buckets=buckets,
        accounts=accounts)

@blue.route('/connections', methods=['GET', 'POST'])
def connections():
    g.show['connections'] = True
    if request.method == 'POST':
        token = request.form['token']
        g.farm.simplefin_claim(token=token)
        flash("Connected")
        return redirect(url_for('.connections', fetch='yes'))
    else:
        connections = g.farm.simplefin_list_connections()
        do_fetch = request.values.get('fetch', '')
        return render_template('farm/connections.html',
            fetch=do_fetch,
            connections=connections)

@blue.route('/reports')
def reports():
    g.show['reports'] = True
    return render_template('farm/reports.html')


#-----------------------------------------------------------------------
# api
#-----------------------------------------------------------------------

@blue.route('/api-', defaults={'label': ''}, methods=['POST'])
@blue.route('/api', defaults={'label': ''}, methods=['POST'])
@blue.route('/api-<string:label>', methods=['POST'])
def api(label):
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
