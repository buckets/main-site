from uuid import uuid4

import structlog
logger = structlog.get_logger()

from flask import Flask, session, g, request, redirect, url_for

from buckets.model import authProtectedAPI
from buckets.web.util import all_filters
from buckets.mailing import PostmarkMailer, NoMailer

f = Flask(__name__)
f.jinja_env.filters.update(all_filters)


def configureApp(engine, flask_secret_key,
        postmark_key=None, debug=False):
    f.engine = engine
    f.config.update(
        DEBUG=debug,
        SECRET_KEY=flask_secret_key)
    if debug:
        logger.info('Running in DEBUG MODE')
        f.jinja_env.cache_size = 0
        f.jinja_env.auto_reload = True
    
    # mailing
    mailer = None
    if not postmark_key and not debug:
        raise Exception('Production mode with no email token.')
    elif postmark_key:
        mailer = PostmarkMailer(postmark_key)
    else:
        logger.warning('No email token -- using debug mailer')
        mailer = NoMailer()

    f._unbound_api = authProtectedAPI(engine, mailer)

    structlog.configure(
        processors=[
            structlog.processors.KeyValueRenderer(
                key_order=['reqid', 'event'],
            ),
        ],
        context_class=structlog.threadlocal.wrap_dict(dict),
        #logger_factory=structlog.stdlib.LoggerFactory(),
    )
    return f


@f.before_request
def put_user_on_request():
    log = logger.new(reqid=str(uuid4()))
    log.bind(path=request.path)

    g.auth_context = {}
    g.user = {}
    g.engine = f.engine
    g.debug = f.config['DEBUG']

    user_id = session.get('user_id', None)
    if user_id:
        g.auth_context['user_id'] = user_id
    g.api = f._unbound_api.bindContext(g.auth_context)
    if user_id:
        try:
            g.user = g.api.user.get_user(id=user_id)
            log.bind(user_id=user_id)
        except Exception as e:
            logger.warning('invalid user id', user_id=user_id, exc_info=e)
            session.pop('user_id', None)
            g.user = {}
            g.auth_context = {}
            g.api = f._unbound_api.bindContext(g.auth_context)

@f.route('/')
def root():
    if g.user:
        return redirect(url_for('app.index'))
    else:
        return redirect(url_for('anon.index'))


from buckets.web import app, anon, farm
f.register_blueprint(farm.blue, url_prefix='/farm/<int:farm_id>')
f.register_blueprint(farm.blue, url_prefix='/farm/<int:farm_id>/y<int:year>m<int:month>')
f.register_blueprint(app.blue, url_prefix='/app')
f.register_blueprint(anon.blue, url_prefix='')
