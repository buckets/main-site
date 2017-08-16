#!/usr/bin/env python

import argparse
import os

from uuid import uuid4
from buckets.web import configureApp


ap = argparse.ArgumentParser()
ap.add_argument('-d', '--debug',
    action='store_true',
    default=os.environ.get('DEBUG'))
ap.add_argument('-k', '--flask-secret-key',
    default=os.environ.get('FLASK_SECRET_KEY', str(uuid4())))
ap.add_argument('--postmark-key',
    default=os.environ.get('POSTMARK_KEY', ''))
ap.add_argument('--stripe-api-key',
    default=os.environ.get('STRIPE_API_KEY', ''))
ap.add_argument('--stripe-public-key',
    default=os.environ.get('STRIPE_PUBLIC_KEY', ''))
ap.add_argument('--sentry-dsn',
    default=os.environ.get('SENTRY_DSN', ''))
ap.add_argument('-H', '--host',
    default='127.0.0.1')
ap.add_argument('-p', '--port',
    default=5000,
    type=int)

args = ap.parse_args()
app = configureApp(
    debug=args.debug,
    flask_secret_key=args.flask_secret_key,
    postmark_key=args.postmark_key,
    stripe_api_key=args.stripe_api_key,
    stripe_public_key=args.stripe_public_key,
    sentry_dsn=args.sentry_dsn)

if __name__ == '__main__':
    threaded = not not args.debug
    app.run(args.host, args.port, threaded=threaded)
