import structlog
logger = structlog.get_logger()

from flask import Blueprint, render_template, request, session, flash, g
from flask import redirect, url_for
from buckets.error import NotFound
from buckets.web.util import bump_pin_expiration, clear_pin_expiration

blue = Blueprint('anon', __name__)

@blue.route('/home')
def index():
    return render_template('anon/index.html')

@blue.route('/register', methods=['POST'])
def register():
    name = request.values['name']
    email = request.values['email']
    user = g.api.user.create_user(email=email, name=name)
    logger.info('User registered', email=email)
    flash('You are registered!')
    
    # sign in
    session['user_id'] = user['id']

    # pretend they set their pin, too
    bump_pin_expiration()

    return redirect('/')

@blue.route('/signin', methods=['POST'])
def signin():
    email = request.form['email']
    try:
        g.api.user.send_signin_email(email=email)
    except NotFound:
        logger.warning('Attempted login for non-existent email', email=email)
    return render_template('anon/emailsent.html',
        email=email)

@blue.route('/auth/<string:token>', methods=['GET'])
def auth(token):
    try:
        user_id = g.api.user.user_id_from_signin_token(token=token)

        # sign in
        session['user_id'] = user_id
    except NotFound:
        flash('Invalid or expired sign in link.', 'error')
        return redirect(url_for('.index'))
    return redirect('/')


@blue.route('/signout', methods=['GET'])
def signout():
    session.pop('user_id')
    clear_pin_expiration()
    flash('You have been signed out')
    return redirect('/')

