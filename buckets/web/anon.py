import structlog
import time
import stripe
import requests
logger = structlog.get_logger()

from flask import Blueprint, render_template, request, flash
from flask import redirect
from flask import current_app

from buckets.drm import createLicense, formatLicense

blue = Blueprint('anon', __name__)


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


# PRIVATE_KEY = os.environ.get('BUCKETS_LICENSE_KEY')
# if not PRIVATE_KEY:
#     if 'OPENSHIFT_DATA_DIR' in os.environ:
#         with open(os.path.join(os.getenv('OPENSHIFT_DATA_DIR'), 'BUCKETS_LICENSE_KEY')) as fh:
#             PRIVATE_KEY = fh.read()

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

@blue.route('/buy', methods=['GET', 'POST'])
def buy():
    if request.method == 'POST':
        token = request.form['stripeToken']
        email = request.form['stripeEmail']
        token_type = request.form.get('stripeTokenType')

        # generate the license
        try:
            license = formatLicense(createLicense(
                email=email,
                private_key=current_app.config['BUCKETS_LICENSE_KEY']))
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
            if token_type == 'source_bitcoin':
                flash('We got your bitcoins.')
            else:
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

Below is your Buckets v1 License.  To use it:

1. Open the Buckets application (download at www.bucketsisbetter.com)
2. Click the "Trial Version" menu
3. Click "Enter License..."
4. Copy and paste the following license into the box
5. Click the button

{license}

This license may be used on any number of computers belonging to you
and your immediate family members living in your home.

Happy budgeting!

- Matt
'''.format(license=license))
        except Exception as e:
            flash("Error emailing license.  If you don't receive an email soon, please reach out to us.", 'error')
            raise
        return render_template('anon/bought.html', license=license)


    return render_template('anon/buy.html')

