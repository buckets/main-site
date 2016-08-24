from datetime import datetime, date, timedelta

from flask import Blueprint, g, render_template, url_for, redirect
from flask import request, flash, make_response, abort

from buckets.authz import NotAuthorized
from buckets.budget import BudgetManagement
from buckets.web.util import toJson, is_pin_expired, bump_pin_expiration
from buckets.web.util import ask_for_pin, get_pin_expiration
from buckets.web.util import require_csrf

import structlog
logger = structlog.get_logger()


blue = Blueprint('farm', __name__, url_prefix='/farm/<int:farm_id>')

@blue.url_value_preprocessor
def pull_values(endpoint, values):
    g.farm_id = values.pop('farm_id')
    
    year = values.pop('year', None)
    month = values.pop('month', None)
    today = date.today()

    try:
        year = int(year)
        month = int(month)
        if month < 1 or month > 12:
            raise ValueError('Invalid month')
    except Exception:
        year = today.year
        month = today.month

    g.month = date(year, month, 1)
    g.month_last_day = (
            (g.month + timedelta(days=45)).replace(day=1)
            - timedelta(days=1)
        )
    if g.month.year == today.year and g.month.month == today.month:
        g.month_last_day = min([g.month_last_day, today])
    elif g.month.year > today.year or (g.month.year == today.year and g.month.month > today.month):
        g.month_last_day = g.month

@blue.url_defaults
def add_defaults(endpoint, values):
    if 'farm_id' in g:
        values.setdefault('farm_id', g.farm_id)
    if 'month' not in g:
        today = date.today()
        g.month = date(today.year, today.month, 1)
    values.setdefault('year', g.month.year)
    values.setdefault('month', g.month.month)

@blue.before_request
def before_request():
    # authorized for this farm?
    try:
        g.farm = farm = g.api.user.get_farm(farm_id=g.farm_id)
    except NotAuthorized:
        abort(404)
    if not farm:
        abort(404)
    if g.user['id'] not in [x['id'] for x in farm['users']]:
        abort(404)

    # have they entered their PIN recently?
    if is_pin_expired():
        if request.endpoint.split('.')[-1] in ['api', 'urlfor']:
            abort(403)
        return ask_for_pin()
    else:
        bump_pin_expiration()

    # have they paid?
    today = date.today()
    exp = farm['service_expiration'] or date(1999, 1, 1)
    days_over = (today - exp)
    logger.info('days_over', days_over=days_over, today=today, exp=exp)
    if days_over > timedelta(days=7):
        flash("Your service has expired.  Please pay to continue"
              " using Buckets.", "error")
        return redirect(url_for('app.farm_subscription', farm_id=g.farm_id))
    elif days_over > timedelta(days=0):
        g.service_expired = True

    api = BudgetManagement(g.conn, g.farm_id)
    g.farmapi = api.policy.bindContext(g.auth_context)


@blue.before_request
def what_should_show():
    g.show = {
        'connections': g.farmapi.has_connections(),
        'transactions': False,
        'buckets': False,
        'reports': False,
    }
    if g.farmapi.has_transactions():
        g.show.update({
            'transactions': True,
            'reports': True,
            'buckets': True,
        })
    elif g.farmapi.has_accounts():
        g.show.update({
            'transactions': True,
            'buckets': True,
        })

@blue.context_processor
def inject_now():
    real_current_month = date.today().replace(day=1)
    return dict(
        now=datetime.utcnow(),
        real_current_month=real_current_month)



@blue.route('/')
def index():
    if g.show['transactions']:
        return redirect(url_for('.transactions'))
    else:
        return redirect(url_for('.accounts'))

@blue.route('/accounts', methods=['GET', 'POST'])
@require_csrf
def accounts():
    if request.method == 'POST':
        name = request.values['name']
        g.farmapi.create_account(name=name)
        flash('Created account')
        return redirect(url_for('farm.accounts'))
    accounts = g.farmapi.list_accounts(month=g.month)
    return render_template('farm/accounts.html',
        accounts=accounts)

@blue.route('/buckets', methods=['GET', 'POST'])
@require_csrf
def buckets():
    g.show['buckets'] = True
    if request.method == 'POST':
        name = request.values['name']
        bucket = g.farmapi.create_bucket(name=name)
        flash('Created bucket')
        return redirect(url_for('farm.bucket', bucket_id=bucket['id']))
    groups = g.farmapi.list_groups()
    buckets = g.farmapi.list_buckets(month=g.month)
    return render_template('farm/buckets.html',
        groups=groups,
        buckets=buckets)

@blue.route('/buckets/<int:bucket_id>', methods=['GET', 'POST'])
@require_csrf
def bucket(bucket_id):
    g.show['buckets'] = True
    if request.method == 'POST':
        data = {}
        data['name'] = request.form['name']
        data['kind'] = request.form['kind']
        data['color'] = request.form['color']
        
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
        
        g.farmapi.update_bucket(id=bucket_id, data=data)
        flash('{0} updated'.format(data['name']))
        return redirect(url_for('.buckets'))
    bucket = g.farmapi.get_bucket(id=bucket_id, month=g.month)
    transactions = g.farmapi.list_bucket_trans(bucket_id=bucket_id,
        month=g.month)
    return render_template('farm/bucket.html',
        bucket=bucket,
        transactions=transactions)

@blue.route('/groups', methods=['POST'])
@require_csrf
def groups():
    g.show['buckets'] = True
    name = request.form['name']
    g.farmapi.create_group(name=name)
    flash('Group created')
    return redirect(url_for('.buckets'))

@blue.route('/groups/<int:group_id>', methods=['GET', 'POST'])
@require_csrf
def group(group_id):
    g.show['buckets'] = True
    if request.method == 'POST':
        data = {}
        data['name'] = request.form['name']
        
        g.farmapi.update_group(id=group_id, data=data)
        flash('{0} updated'.format(data['name']))
        return redirect(url_for('.buckets'))
    group = g.farmapi.get_group(id=group_id)
    return render_template('farm/group.html',
        group=group)

@blue.route('/transactions')
def transactions():
    g.show['transactions'] = True
    buckets = g.farmapi.list_buckets(month=g.month)
    accounts = g.farmapi.list_accounts(month=g.month)
    return render_template('farm/transactions.html',
        buckets=buckets,
        accounts=accounts)

@blue.route('/connections', methods=['GET', 'POST'])
@require_csrf
def connections():
    g.show['connections'] = True
    if request.method == 'POST':
        token = request.form['token']
        g.farmapi.simplefin_claim(token=token)
        flash("Connected")
        return redirect(url_for('.connections', fetch='yes'))
    else:
        connections = g.farmapi.simplefin_list_connections()
        do_fetch = request.values.get('fetch', '')
        return render_template('farm/connections.html',
            fetch=do_fetch,
            connections=connections)

@blue.route('/reports')
def reports():
    g.show['reports'] = True
    starting = date.today() - timedelta(weeks=48)
    account_summary = g.farmapi.monthly_account_summary(starting=starting)
    bucket_summary = g.farmapi.monthly_bucket_summary(starting=starting)
    return render_template('farm/reports.html',
        account_summary=account_summary,
        bucket_summary=bucket_summary)


#-----------------------------------------------------------------------
# api
#-----------------------------------------------------------------------

@blue.route('/url_for', methods=['POST'])
@require_csrf
def urlfor():
    data = request.json
    endpoint = '.{0}'.format(data['endpoint'].lstrip('.'))
    kwargs = data.get('kwargs', {})
    for key in list(kwargs.keys()):
        if key.startswith('_'):
            kwargs.pop(key)
    return url_for(endpoint, **kwargs)


@blue.route('/api-', defaults={'label': ''}, methods=['POST'])
@blue.route('/api', defaults={'label': ''}, methods=['POST'])
@blue.route('/api-<string:label>', methods=['POST'])
@require_csrf
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
        m = getattr(g.farmapi, method)
        responses.append(m(**kwargs))
    
    if not multi:
        responses = responses[0]
    r = make_response(toJson(responses))
    r.headers['Content-Type'] = 'application/json'
    r.headers['PIN-Expiration'] = get_pin_expiration()
    return r
