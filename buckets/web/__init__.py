from flask import Flask, request, session, redirect
from buckets.model import authProtectedAPI

app = Flask(__name__)


def configureApp(engine, flask_secret_key, debug=False):
    app.engine = engine
    app.secret_key = flask_secret_key
    app.debug = debug
    app._unbound_api = authProtectedAPI(engine)


@app.before_request
def put_user_on_request():
    request.user_id = session.get('user_id', None)
    auth_context = {}
    if request.user_id:
        auth_context['user_id'] = request.user_id
    request.api = app._unbound_api.bindContext(auth_context)


@app.route('/')
def index():
    if request.user:
        return redirect('/app')
    else:
        return redirect('/hi')


from buckets.web import budget, frame
app.register_blueprint(frame.blue, url_prefix='/hi')
app.register_blueprint(budget.blue, url_prefix='/app')
