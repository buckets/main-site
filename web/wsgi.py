#!/usr/bin/python
import os
import uuid
from buckets.web import configureApp

FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY', str(uuid.uuid4()))
POSTMARK_KEY = os.getenv('POSTMARK_KEY', '')
STRIPE_API_KEY = os.getenv('STRIPE_API_KEY', '')
STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY', '')
SENTRY_DSN = os.getenv('SENTRY_DSN', '')
BUCKETS_LICENSE_KEY = os.getenv('BUCKETS_LICENSE_KEY', '')
PAYPAL_ACCESS_TOKEN = os.getenv('PAYPAL_ACCESS_TOKEN', '')


application = configureApp(
    flask_secret_key=FLASK_SECRET_KEY,
    debug=False,
    postmark_key=POSTMARK_KEY,
    stripe_api_key=STRIPE_API_KEY,
    stripe_public_key=STRIPE_PUBLIC_KEY,
    sentry_dsn=SENTRY_DSN,
    buckets_license_key=BUCKETS_LICENSE_KEY,
    paypal_access_token=PAYPAL_ACCESS_TOKEN)
