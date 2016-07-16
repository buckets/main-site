import argparse
from buckets.web import configureApp
import os
from uuid import uuid4
from sqlalchemy import create_engine
from buckets.schema import upgrade_schema


ap = argparse.ArgumentParser()
ap.add_argument('-d', '--debug',
    action='store_true')
ap.add_argument('-D', '--database',
    default=os.environ.get('DATABASE_URL'),
    help='Database URL.  (env: DATABASE_URL)')
ap.add_argument('-k', '--flask-secret-key',
    default=os.environ.get('FLASK_SECRET_KEY', str(uuid4())))

args = ap.parse_args()
if not args.database:
    raise Exception("You must provide a database")

engine = create_engine(args.database)
upgrade_schema(engine)

app = configureApp(
    debug=args.debug,
    engine=engine,
    flask_secret_key=args.flask_secret_key)

app.run()
