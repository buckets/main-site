from flask import Flask, session, redirect, g
from buckets.model import authProtectedAPI
from buckets.web.util import all_filters


f = Flask(__name__)
f.jinja_env.filters.update(all_filters)


def configureApp(engine, flask_secret_key, debug=False):
    f.engine = engine
    f.config.update(
        DEBUG=debug,
        TEMPLATES_AUTO_RELOAD=debug,
        SECRET_KEY=flask_secret_key)
    if debug:
        f.jinja_env.cache_size = 0
    f._unbound_api = authProtectedAPI(engine)
    return f


@f.before_request
def put_user_on_request():
    g.auth_context = {}
    g.user = {}
    g.engine = f.engine

    user_id = session.get('user_id', None)
    if user_id:
        g.auth_context['user_id'] = user_id
    g.api = f._unbound_api.bindContext(g.auth_context)
    if user_id:
        try:
            g.user = g.api.user.get_user(id=user_id)
        except:
            session.pop('user_id', None)
            g.user = {}
            g.auth_context = {}
            g.api = f._unbound_api.bindContext(g.auth_context)


@f.route('/')
def index():
    if g.user:
        return redirect('/app')
    else:
        return redirect('/hi')


from buckets.web import app, frame, farm
f.register_blueprint(frame.blue, url_prefix='/hi')
f.register_blueprint(farm.blue, url_prefix='/farm/<int:farm_id>')
f.register_blueprint(app.blue, url_prefix='/app')
