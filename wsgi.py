#!/usr/bin/python
import os

virtenv = os.environ['OPENSHIFT_PYTHON_DIR'] + '/virtenv/'
virtualenv = os.path.join(virtenv, 'bin/activate_this.py')
try:
    execfile(virtualenv, dict(__file__=virtualenv))
except IOError:
    pass
#
# IMPORTANT: Put any additional includes below this line.  If placed above this
# line, it's possible required libraries won't be in your searchable path
#

import time
from sqlalchemy import create_engine
from buckets.schema import upgrade_schema
from buckets.web import configureApp

DATABASE_URL = os.environ['OPENSHIFT_POSTGRESQL_DB_URL']
FLASK_SECRET_KEY = os.environ['FLASK_SECRET_KEY']
POSTMARK_KEY = os.environ['POSTMARK_KEY']

engine = create_engine(DATABASE_URL)
while True:
    try:
        engine.connect().close()
        break
    except:
        time.sleep(0.5)
upgrade_schema(engine)


application = configureApp(
    engine=engine,
    flask_secret_key=FLASK_SECRET_KEY,
    debug=False,
    postmark_key=POSTMARK_KEY)
