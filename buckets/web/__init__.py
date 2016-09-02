import structlog
import stripe
import logging
logger = structlog.get_logger()

from flask import Flask, session, g, request, redirect, url_for
from flask import render_template

from raven.contrib.flask import Sentry

from buckets.dbutil import transaction_per_request
from buckets.mailing import PostmarkMailer, NoMailer
from buckets.model import authProtectedAPI
from buckets.web.util import all_filters, all_globals
from buckets.web.util import GLOBAL_CSRF
from buckets.web.util import is_pin_expired, get_pin_expiration
from buckets.web.util import structlog_context, sentry_context
from buckets.web.util import send_warnings_to_sentry

f = Flask(__name__)
f.jinja_env.filters.update(all_filters)
f.jinja_env.globals.update(all_globals)

sentry = Sentry()

# monkey patch for https://github.com/getsentry/raven-python/issues/842
_real = sentry.get_user_info
sentry.get_user_info = lambda *a,**kw: (_real(*a,**kw) or {})


def configureApp(engine, flask_secret_key,
        postmark_key,
        stripe_api_key,
        stripe_public_key,
        sentry_dsn,
        debug=False,
        registration_delay=3):
    sentry.init_app(f, dsn=sentry_dsn)

    f._engine = engine
    f.config.update(
        DEBUG=debug,
        SECRET_KEY=flask_secret_key,
        REGISTRATION_DELAY=registration_delay,
        STRIPE_PUBLIC_KEY=stripe_public_key)

    GLOBAL_CSRF.secret = flask_secret_key

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
    twisted_log = logging.getLogger("twisted")
    twisted_log.addHandler(logging.StreamHandler())
    return f

@f.errorhandler(404)
def handle_404(err):
    sentry.client.captureMessage('404 {0}'.format(request.path))
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

transaction_per_request(f)


@f.before_request
def put_user_on_request():
    # initial context
    log = logger.new(**structlog_context())
    sentry.client.context.merge(sentry_context())

    g.auth_context = {}
    g.user = {}
    g.user_id = None
    g.debug = f.config['DEBUG']
    g.pin_valid = not is_pin_expired()
    g.pin_expiration = get_pin_expiration()

    user_id = session.get('user_id', None)
    if user_id:
        g.auth_context['user_id'] = user_id
        sentry.client.user_context({
            'user_id': user_id,
        })
    unbound_api = authProtectedAPI(g.conn, f.mailer, stripe=stripe)
    g.api = unbound_api.bindContext(g.auth_context)
    if user_id:
        try:
            g.user = g.api.user.get_user(id=user_id)
            g.user_id = user_id
            log.bind(user_id=user_id)
        except Exception as e:
            logger.warning('invalid user id', user_id=user_id, exc_info=e)
            sentry.captureMessage('invalid user id')
            session.pop('user_id', None)
            g.user = {}
            g.auth_context = {}
            g.api = unbound_api.bindContext(g.auth_context)

    # context that includes user stuff
    sentry.client.context.merge(sentry_context())
    log.bind(**structlog_context())

@f.route('/')
def root():
    if g.user:
        return redirect(url_for('app.index'))
    else:
        return redirect(url_for('anon.index'))

@f.route('/error')
def err():
    raise Exception('The exception')

@f.route('/warning')
def warning():
    logger.warning('Test warning', name='the test')
    return 'warning'

from buckets.web import app, anon, farm
f.register_blueprint(farm.blue, url_prefix='/farm/<int:farm_id>')
f.register_blueprint(farm.blue, url_prefix='/farm/<int:farm_id>/y<int:year>m<int:month>')
f.register_blueprint(app.blue, url_prefix='/app')
f.register_blueprint(anon.blue, url_prefix='')
