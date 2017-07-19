import structlog
import time
import stripe
import os
logger = structlog.get_logger()

from flask import Blueprint, render_template, request, session, flash, g
from flask import redirect, url_for
from flask import current_app

from buckets.billing import BillingManagement
from buckets.error import NotFound, DuplicateRegistration, BadValue
from buckets.web.util import bump_pin_expiration, clear_pin_expiration
from buckets.web.util import run_async
from buckets.drm import createLicense, formatLicense

blue = Blueprint('anon', __name__)

@blue.route('/home')
def index():
    return render_template('anon/index.html',
        plans=BillingManagement.PLANS)

@blue.route('/register', methods=['POST'])
def register():
    name = request.values['name']
    email = request.values['email']
    time.sleep(current_app.config.get('REGISTRATION_DELAY', 3))
    try:
        user = g.api.user.create_user(email=email, name=name)
    except BadValue:
        flash('You need a valid email address and a name', 'error')
        return redirect('/')
    except DuplicateRegistration:
        flash('Account already registered', 'error')
        return redirect('/')
        
    logger.info('User registered', email=email)
    run_async(current_app.mailer.sendPlain,
            'hello@bucketsisbetter.com',
            ('Buckets', 'hello@bucketsisbetter.com'),
            'New user: %s' % (email,),
            'Email: %s\n' % (email,))
    run_async(current_app.mailer.sendPlain,
        email,
        ('Buckets', 'hello@bucketsisbetter.com'),
        subject='Welcome to Buckets',
        body='''Welcome to Buckets!

I hope you enjoy using Buckets as much as we do.  Here's the basics
to get you started:

- Track your real-life account balances (Checking, Savings)
- Assign your money into various buckets (Food, Rent, Gas, etc...)
- Every month, "make it rain" to replenish your buckets (your income is the rain)

After you poke around a bit let me know if you have any questions
about Buckets.  We're a small operation (my wife and I), so I'd
be happy to take the time to walk you through setting up your budget.

Thanks,

Matt Haggard
hello@bucketsisbetter.com
''')
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
    flash('You have been completely signed out')
    return redirect('/')


#----------------------------------------------------
# application
#----------------------------------------------------
@blue.route('/buy', methods=['GET', 'POST'])
def buy():
    if request.method == 'POST':
        token = request.form['stripeToken']
        email = request.form['stripeEmail']

        # generate the license
        try:
            license = formatLicense(createLicense(
                email=email,
                private_key=os.environ['BUCKETS_LICENSE_KEY']))
        except Exception as e:
            flash('Error generating license.  Your card was not charged.', 'error')
            raise

        # charge the card
        try:
            stripe.Charge.create(
                amount=2000,
                currency='usd',
                description='Buckets v1 License',
                statement_descriptor='Buckets Budgeting App',
                receipt_email=email,
                source=token)
            flash('Your card was charged.')

        except stripe.error.CardError as e:
            flash(e.message, 'error')
        except Exception as e:
            raise

        # email the license
        try:
            current_app.mailer.sendPlain(email,
                ('Buckets', 'hello@bucketsisbetter.com'),
                subject='Buckets v1 License',
                body='''Thank you for purchasing Buckets!

Here is your Buckets v1 License.  To use it:

1. Open the Buckets application (download at www.bucketsisbetter.com)
2. Click the "Trial Version" menu
3. Click "Enter License..."
4. Copy and paste the following license into the box
5. Click the button

{license}

This license may be used on any number of computers belonging to you
and your immediate family members living in your home.

Again, thank you for you purchase!  I'm happy to help you with Buckets,
(and to hear your complaints) so don't hesitate to reach out.

- Matt
'''.format(license=license))
        except Exception as e:
            flash("Error emailing license.  If you don't receive an email soon, please reach out to us.", 'error')
            raise
        return redirect(url_for('.bought'))


    return render_template('anon/buy.html')

@blue.route('/bought', methods=['GET'])
def bought():
    return render_template('anon/bought.html')
