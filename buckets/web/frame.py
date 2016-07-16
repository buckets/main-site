from flask import Blueprint, render_template, request, session, flash, g
from flask import redirect

blue = Blueprint('frame', __name__)


@blue.route('/')
def index():
    return render_template('frame/index.html')

@blue.route('/register', methods=['POST'])
def register():
    name = request.values['name']
    email = request.values['email']
    user = g.api.user.create_user(email=email, name=name)
    g.api.user.create_farm(creator_id=user['id'])
    flash('You are registered!')
    
    # sign in
    session['user_id'] = user['id']

    return redirect('/')

@blue.route('/signin', methods=['POST'])
def signin():
    return render_template('frame/index.html')

