#!/usr/bin/env python
from sqlalchemy import create_engine

from buckets.dbutil import begin
from buckets.budget import BudgetManagement

import os
import argparse
import time


def main(engine, days=7):
    start = time.time()
    r = engine.execute('''
        SELECT
            distinct(farm_id)
        FROM
            simplefin_connection
        ORDER BY 1
    ''')
    farm_ids = [x[0] for x in r.fetchall()]

    for farm_id in farm_ids:
        print 'Farm:', farm_id
        with begin(engine):
            api = BudgetManagement(
                engine=engine,
                farm_id=farm_id)
            result = {}
            try:
                result = api.simplefin_fetch(days=days)
                print 'SUCCESS'
            except Exception as e:
                print e
            if 'errors' in result:
                print 'User errors: {0}'.format(result['errors'])

    diff = time.time() - start
    print 'Took {0}s for {1} farms'.format(diff, len(farm_ids))

p = argparse.ArgumentParser()
p.add_argument('-D', '--database',
    default=os.getenv('DATABASE_URL', ''))
p.add_argument('-d', '--days',
    type=int,
    default=7,
    help=('Number of days back to fetch.'
          ' (default: %(default)s)'))

if __name__ == '__main__':
    args = p.parse_args()
    engine = create_engine(args.database)
    main(engine, days=args.days)
