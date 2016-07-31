#!/usr/bin/env python

import argparse
import os
import time
from uuid import uuid4

from sqlalchemy import create_engine

from buckets.web import configureApp
from buckets.schema import upgrade_schema


ap = argparse.ArgumentParser()
ap.add_argument('-d', '--debug',
    action='store_true',
    default=os.environ.get('DEBUG'))
ap.add_argument('-D', '--database',
    default=os.environ.get('DATABASE_URL'),
    help='Database URL.  (env: DATABASE_URL)')
ap.add_argument('-k', '--flask-secret-key',
    default=os.environ.get('FLASK_SECRET_KEY', str(uuid4())))
ap.add_argument('-H', '--host',
    default='127.0.0.1')
ap.add_argument('-p', '--port',
    default=5000,
    type=int)

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

app = configureApp(
    debug=args.debug,
    engine=engine,
    flask_secret_key=args.flask_secret_key,
    postmark_key=None,
    public_url='http://{args.host}:{args.port}'.format(**locals()))

app.run(args.host, args.port, debug=args.debug)
