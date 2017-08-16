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

from buckets.web import configureApp

FLASK_SECRET_KEY = os.environ['FLASK_SECRET_KEY']
POSTMARK_KEY = os.environ['POSTMARK_KEY']
STRIPE_API_KEY = os.environ['STRIPE_API_KEY']
STRIPE_PUBLIC_KEY = os.environ['STRIPE_PUBLIC_KEY']
SENTRY_DSN = os.environ['SENTRY_DSN']

application = configureApp(
    flask_secret_key=FLASK_SECRET_KEY,
    debug=False,
    postmark_key=POSTMARK_KEY,
    stripe_api_key=STRIPE_API_KEY,
    stripe_public_key=STRIPE_PUBLIC_KEY,
    sentry_dsn=SENTRY_DSN)
