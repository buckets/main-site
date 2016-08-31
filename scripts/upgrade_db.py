#!/usr/bin/env python

import argparse
import os
import time

from sqlalchemy import create_engine

from buckets.schema import upgrade_schema


ap = argparse.ArgumentParser()
ap.add_argument('-D', '--database',
    default=os.environ.get('DATABASE_URL'),
    help='Database URL.  (env: DATABASE_URL)')

args = ap.parse_args()
if not args.database:
    raise Exception("You must provide a database")

engine = create_engine(args.database)
while True:
    try:
        engine.connect().close()
        break
    except:
        time.sleep(0.5)
upgrade_schema(engine)
