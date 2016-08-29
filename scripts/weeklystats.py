#!/usr/bin/env python
from sqlalchemy import create_engine
from datetime import date, timedelta

from collections import defaultdict
from jinja2 import Environment
env = Environment()
# from buckets.dbutil import begin
# from buckets.budget import BudgetManagement

import os
import argparse


def main(engine, email=None):
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
        data[row[0]]['new_users'] = [x for x in row[1] if x]

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
            data[when]['did_something'].append({
                'name': user,
                'number': number,
            })

    print data
    tmpl = env.from_string(TEMPLATE)
    print tmpl.render(months=data)


TEMPLATE = '''
New Users
=============================
{% for month in months|reverse %}{{ month.strftime('%b %Y') }} - {{ months[month].new_users|length }} - {{ months[month].new_users|join(', ') }}
{% endfor %}

Users that Did Something
=============================
{% for month in months|reverse %}{{ month.strftime('%b %Y') }} - {{ months[month].did_something|length }} - {% for user in months[month].did_something %}{% if not loop.first %}, {% endif %}{{ user.name }}({{ user.number }}){% endfor %}
{% endfor %}

Subscriptions
=============================
XXX
'''    


p = argparse.ArgumentParser()
p.add_argument('-D', '--database',
    default=os.getenv('DATABASE_URL', ''))
p.add_argument('--email',
    help='Email to email results to.')


if __name__ == '__main__':
    args = p.parse_args()
    engine = create_engine(args.database)
    main(engine, args.email)
