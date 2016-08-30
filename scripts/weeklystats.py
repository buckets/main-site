#!/usr/bin/env python
from sqlalchemy import create_engine
from datetime import date, timedelta
import stripe
import time

from collections import defaultdict
from jinja2 import Environment

from buckets.web.util import fmtMoney
from buckets.mailing import PostmarkMailer

import os
import argparse


def main(engine, stripe_api_key, postmark_key=None, email=None):
    today = date.today()
    start = (today - timedelta(days=90)).replace(day=1)
    stop = today

    data = defaultdict(lambda:defaultdict(list))

    # users
    r = engine.execute('''
        SELECT
            s,
            array_agg(new_u.name) as new_users
        FROM
            generate_series(%s::timestamp, %s::timestamp, '1 month') as s
            left join user_ as new_u
                on date_trunc('month', new_u.created)
                    = date_trunc('month', s)
        GROUP BY
            s
        ''', (start, stop))
    rows = r.fetchall()
    for row in rows:
        data[row[0].date()]['new_users'] = [x for x in row[1] if x]

    # farms with activity
    r = engine.execute('''
        SELECT
            s,
            sum(number) as number,
            u.name
        FROM
            generate_series(%s::timestamp, %s::timestamp, '1 month') as s
            left join (
                select count(*) as number, created, farm_id from account GROUP BY 2,3
                union all
                select count(*), created, farm_id from bucket_group GROUP BY 2,3
                union all
                select count(*), created, farm_id from bucket GROUP BY 2,3
                union all
                select count(*), created, farm_id from simplefin_connection GROUP BY 2,3
                union all
                select count(*), created, farm_id from account_mapping GROUP BY 2,3
                union all
                select
                    count(*), bt.created, b.farm_id
                from
                    bucket_transaction as bt
                    left join bucket as b
                        on bt.bucket_id = b.id
                GROUP BY 2,3
                union all
                select
                    count(*), at.created, a.farm_id
                from
                    account_transaction as at
                    left join account as a
                        on at.account_id = a.id
                GROUP BY 2,3
            ) as totals
                on date_trunc('month', totals.created) = s
            left join user_farm_join as j
                on j.farm_id = totals.farm_id
            left join user_ as u
                on j.user_id = u.id
        GROUP BY 1,3
    ''', (start, stop))
    rows = r.fetchall()
    for (when, number, user) in rows:
        if number and user:
            data[when.date()]['did_something'].append({
                'name': user,
                'number': number,
            })

    stripe.api_key = stripe_api_key
    stripe.api_version = '2016-07-06'
    s = start
    while s <= stop:
        e = (s + timedelta(days=45)).replace(day=1)
        s_ts = int(time.mktime(s.timetuple()))
        e_ts = int(time.mktime(e.timetuple()))
        query = stripe.BalanceTransaction.all(created={
            'gte': s_ts,
            'lt': e_ts,
        })
        income = 0
        refund = 0
        fees = 0
        for trans in query.auto_paging_iter():
            if trans.amount > 0:
                income += trans.amount
            else:
                refund += abs(trans.amount)
            fees += trans.fee
        data[s]['income'] = income
        data[s]['refund'] = refund
        data[s]['fees'] = fees
        data[s]['net'] = income - refund - fees
        s = e

    env = Environment()
    env.filters['money'] = fmtMoney
    tmpl = env.from_string(TEMPLATE)
    output = tmpl.render(months=data)
    print output

    if email:
        if not postmark_key:
            raise Exception("Can't email without a POSTMARK_KEY")
        mailer = PostmarkMailer(postmark_key)
        mailer.sendPlain(email, ('Buckets', 'hello@bucketsisbetter.com'),
            'Buckets Weekly Stats',
            body=output)
        print 'sent email to {0}'.format(email)


TEMPLATE = '''
New Users
=============================
{% for month,item in months|dictsort|reverse -%}
{{ month.strftime('%b %Y') }} - {{ item.new_users|length }} - {{ item.new_users|join(', ') }}
{% endfor %}

Users that Did Something
=============================
{% for month,item in months|dictsort|reverse -%}
{{ month.strftime('%b %Y') }} - {{ item.did_something|length }} - {% for user in item.did_something %}{% if not loop.first %}, {% endif %}{{ user.name }}({{ user.number }}){% endfor %}
{% endfor %}

Money
=============================
           net = income - refunds - fees
{% for month,item in months|dictsort|reverse -%}
{{ month.strftime('%b %Y') }} - ${{ item.net|money }} = ${{ item.income|money }} - ${{ item.refund|money }} - ${{ item.fees|money }}
{% endfor %}
'''    


p = argparse.ArgumentParser()
p.add_argument('-D', '--database',
    default=os.getenv('DATABASE_URL', ''))
p.add_argument('--stripe-api-key',
    default=os.environ.get('STRIPE_API_KEY', ''))
p.add_argument('--postmark-key',
    default=os.environ.get('POSTMARK_KEY', ''))
p.add_argument('--email',
    help='Email to email results to.')


if __name__ == '__main__':
    args = p.parse_args()
    engine = create_engine(args.database)
    main(engine, args.stripe_api_key, args.postmark_key, args.email)
