import structlog
import time
import stripe
import requests
import json
logger = structlog.get_logger()

from flask import Blueprint, render_template, request, flash
from flask import redirect, url_for, g
from flask import current_app
from flask_babel import gettext

from buckets.drm import createLicense, formatLicense

blue = Blueprint('anon', __name__)

PRICE_CENTS = 2900
PRICE_STRING = '29.00'

_latest_version = None
_latest_version_lastfetch = None
_latest_version_lifespan = 60 * 60 * 1
def getLatestReleaseVersion():
    global _latest_version, _latest_version_lastfetch
    now = time.time()
    if _latest_version_lastfetch and now < (_latest_version_lastfetch + _latest_version_lifespan):
        return _latest_version

    url = 'https://api.github.com/repos/buckets/application/releases/latest'
    try:
        r = requests.get(url, timeout=5)
        _latest_version = r.json()['tag_name'].strip('v')
    except:
        import traceback
        traceback.print_exc()
        _latest_version = None
    _latest_version_lastfetch = now
    logger.info('latest_version', _latest_version=_latest_version)
    return _latest_version


@blue.url_defaults
def add_language_code(endpoint, values):
    values.setdefault('lang_code', g.get('lang_code', 'en'))

@blue.url_value_preprocessor
def pull_lang_code(endpoint, values):
    logger.debug('lang_code into g', lang_code=values.get('lang_code'))
    g.lang_code = values.pop('lang_code', 'en')


#----------------------------------------------------
# application
#----------------------------------------------------
@blue.route('/', methods=['GET'])
def index():
    latest_version = getLatestReleaseVersion()
    return render_template('anon/index.html',
        latest_version=latest_version)

@blue.route('/chat', methods=['GET'])
def chat():
    return redirect('https://tawk.to/chat/59835f8ed1385b2b2e285765/default/?$_tawk_popout=true')

@blue.route('/gettingstarted', methods=['GET'])
def gettingstarted():
    return render_template('anon/gettingstarted.html')

@blue.route('/help', methods=['GET'])
def help():
    return redirect(url_for('.gettingstarted'))

def generateLicense(email):
    return formatLicense(createLicense(
        email=email,
        private_key=current_app.config['BUCKETS_LICENSE_KEY']))

def emailLicense(email, license):
    try:
        current_app.mailer.sendPlain(email,
            ('Buckets', 'hello@budgetwithbuckets.com'),
            subject=gettext('Buckets v1 License'),
            body=gettext('''Thank you for purchasing Buckets!

    Below is your Buckets v1 License.  To use it:

    1. Open the Buckets application (download at www.budgetwithbuckets.com)
    2. Click the "Trial Version" menu
    3. Click "Enter License..."
    4. Copy and paste the following license into the box
    5. Click the button

    {license}

    This license may be used on any number of computers belonging to you
    and your immediate family members living in your home.

    Happy budgeting!

    - Matt
    ''').format(license=license))
    except Exception:
        flash(gettext("Error emailing license.  If you don't receive an email soon, please reach out to us.", 'error'))
        raise

@blue.route('/buy', methods=['GET', 'POST'])
def buy():
    if request.method == 'POST':
        token = request.form['stripeToken']
        email = request.form['stripeEmail']
        token_type = request.form.get('stripeTokenType')

        # generate the license
        try:
            generateLicense(email)
        except Exception:
            flash(gettext('Error generating license.  Your card was not charged.'), 'error')
            raise

        # charge the card
        try:
            stripe.Charge.create(
                amount=PRICE_CENTS,
                currency='usd',
                description='Buckets v1 License',
                statement_descriptor=gettext('Buckets Budgeting App'),
                receipt_email=email,
                source=token)
            if token_type == 'source_bitcoin':
                flash(gettext('We got your bitcoins.'))
            else:
                flash(gettext('Your card was charged.'))

        except stripe.error.CardError as e:
            flash(e.message, 'error')
        except Exception as e:
            raise

        # email the license
        emailLicense(email, license)
        return render_template('anon/bought.html', license=license)


    return render_template('anon/buy.html', PRICE_CENTS=PRICE_CENTS, PRICE_STRING=PRICE_STRING)


@blue.route('/paypal-create-payment', methods=['POST'])
def paypal_create_payment():
    current_app.logger.info('Call to paypal-create-payment')
    paypal = current_app.paypal
    paymentID = paypal.createPayment(PRICE_STRING)
    return json.dumps({
        'paymentID': paymentID,
    })
    # tx = request.args.get('tx', '')
    # if not tx:
    #     flash(gettext("There was an error processing your transaction."), 'error')
    #     raise Exception('Error processing transaction')

    # try:
    #     generateLicense(email)
    # except Exception:
    #     flash(gettext('Error generating license BUT YOU WERE CHARGED.  Please contact me at hello@budgetwithbuckets.com'), 'error')
    #     raise
    # emailLicense(email, license)
    # return render_template('anon/bought.html', license=license)

@blue.route('/paypal-execute-payment', methods=['POST'])
def paypal_execute_payment():
    pass




