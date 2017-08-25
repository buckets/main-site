import structlog
import stripe
import logging
logger = structlog.get_logger()

from flask import Flask, g, request
from flask import render_template

from raven.contrib.flask import Sentry

from buckets.mailing import PostmarkMailer, NoMailer
from buckets.web.util import structlog_context, sentry_context
from buckets.web.util import send_warnings_to_sentry

f = Flask(__name__)

sentry = Sentry()

def configureApp(flask_secret_key,
        postmark_key,
        stripe_api_key,
        stripe_public_key,
        sentry_dsn,
        buckets_license_key,
        debug=False):
    sentry.init_app(f, dsn=sentry_dsn)

    f.config.update(
        DEBUG=debug,
        SECRET_KEY=flask_secret_key,
        STRIPE_PUBLIC_KEY=stripe_public_key,
        BUCKETS_LICENSE_KEY=buckets_license_key,
    )

    if debug:
        logger.info('Flask: debug')
        f.jinja_env.cache_size = 0
        f.jinja_env.auto_reload = True
    else:
        logger.info('Flask: PRODUCTION')
    
    # mailing
    mailer = None
    if not postmark_key and not debug:
        logger.warning('Mail: PRODUCTION with no email token.')
    elif postmark_key:
        mailer = PostmarkMailer(postmark_key)
        logger.info('Mail: PRODUCTION')
    else:
        logger.info('Mail: debug')
        mailer = NoMailer()
    f.mailer = mailer

    # stripe
    if debug and 'test' not in stripe_api_key:
        raise Exception('Stripe: Test Stripe key must be used in debug mode')
    elif not debug and 'test' in stripe_api_key:
        logger.warning('Stripe: Using test Stripe key in production mode')
    if 'test' in stripe_api_key:
        logger.info('Stripe: debug')
    else:
        logger.info('Stripe: PRODUCTION')
    stripe.api_key = stripe_api_key
    stripe.api_version = '2016-07-06'

    structlog.configure(
        processors=[
            send_warnings_to_sentry,
            structlog.processors.KeyValueRenderer(
                key_order=['reqid', 'event', 'path'],
            ),
        ],
        context_class=structlog.threadlocal.wrap_dict(dict),
        #logger_factory=structlog.stdlib.LoggerFactory(),
    )
    sentry_errors_log = logging.getLogger("sentry.errors")
    sentry_errors_log.addHandler(logging.StreamHandler())
    return f

@f.errorhandler(404)
def handle_404(err):
    return render_template('err404.html')

@f.template_global()
def request_debug_data():
    try:
        import json
        return json.dumps({
            'url': request.url,
            'method': request.method,
        }, indent=2)
    except:
        return 'ERROR-PACKING-DATA'

@f.errorhandler(500)
def handle_500(err):
    logger.exception(exc_info=err)
    logger.info(g=g, last_event_id=sentry.last_event_id)
    return render_template('err500.html',
        sentry_event_id=sentry.last_event_id,
        sentry_public_dsn=sentry.client.get_public_dsn('https'),
    ), 500


@f.before_request
def put_user_on_request():
    # initial context
    log = logger.new(**structlog_context())
    sentry.client.context.merge(sentry_context())
    log.bind(**structlog_context())

@f.route('/robots.txt')
def robots_txt():
    return 'User-Agent: *\n'

@f.route('/error')
def err():
    raise Exception('The exception')

@f.route('/warning')
def warning():
    logger.warning('Test warning', name='the test')
    return 'warning'

from buckets.web import anon
f.register_blueprint(anon.blue, url_prefix='')
