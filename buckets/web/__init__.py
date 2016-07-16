from flask import Flask, session, redirect, g
from buckets.model import authProtectedAPI


app = Flask(__name__)


def configureApp(engine, flask_secret_key, debug=False):
    app.engine = engine
    app.secret_key = flask_secret_key
    app.debug = debug
    app._unbound_api = authProtectedAPI(engine)
    return app


@app.before_request
def put_user_on_request():
    auth_context = {}
    g.user = {}

    user_id = session.get('user_id', None)
    if user_id:
        auth_context['user_id'] = user_id
    g.api = app._unbound_api.bindContext(auth_context)
    if user_id:
        g.user = g.api.user.get_user(id=user_id)


@app.route('/')
def index():
    if g.user_id:
        return redirect('/app')
    else:
        return redirect('/hi')


from buckets.web import budget, frame
app.register_blueprint(frame.blue, url_prefix='/hi')
app.register_blueprint(budget.blue, url_prefix='/app')
