from flask import Flask, request, session, redirect


app = Flask(__name__)

@app.before_request
def put_user_on_request():
    request.user = session.get('user', None)


@app.route('/')
def index():
    if request.user:
        return redirect('/app')
    else:
        return redirect('/hi')



from buckets.web import budget, frame
app.register_blueprint(frame.blue, url_prefix='/hi')
app.register_blueprint(budget.blue, url_prefix='/app')
