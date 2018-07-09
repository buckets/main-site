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
PAYPAL_CLIENT_ID = os.getenv('PAYPAL_CLIENT_ID', '')
PAYPAL_CLIENT_SECRET = os.getenv('PAYPAL_CLIENT_SECRET', '')
STATIC_SITE_URL = 'https://www.budgetwithbuckets.com'


application = configureApp(
    flask_secret_key=FLASK_SECRET_KEY,
    debug=False,
    postmark_key=POSTMARK_KEY,
    stripe_api_key=STRIPE_API_KEY,
    stripe_public_key=STRIPE_PUBLIC_KEY,
    sentry_dsn=SENTRY_DSN,
    buckets_license_key=BUCKETS_LICENSE_KEY,
    paypal_client_id=PAYPAL_CLIENT_ID,
    paypal_client_secret=PAYPAL_CLIENT_SECRET,
    static_site_url=STATIC_SITE_URL)
