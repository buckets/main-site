import structlog
import stripe
import paypalrestsdk
logger = structlog.get_logger()

from flask import Blueprint, render_template, request, flash
from flask import redirect, url_for, g
from flask import current_app
from flask_babel import gettext

from buckets.drm import createLicense, formatLicense

blue = Blueprint('anon', __name__)

PRICE_CENTS = 4900
PRICE_STRING = '49.00'


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
    return redirect(current_app.config['STATIC_SITE_URL'])

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

@blue.route('/buy', methods=['POST'])
def buy():
    if request.method == 'POST':
        token = request.form['stripeToken']
        email = request.form['stripeEmail']

        # generate the license
        try:
            license = generateLicense(email)
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
            flash(gettext('Your card was charged.'))

        except stripe.error.CardError as e:
            flash(e.message, 'error')
        except Exception as e:
            raise

        # email the license
        emailLicense(email, license)
        return render_template('bought.html', license=license)

    return redirect(current_app.config['STATIC_SITE_URL'] + '/{0}/buy.html'.format(g.get('lang_code', 'en')))


@blue.route('/paypal-create-payment', methods=['POST'])
def paypal_create_payment():
    current_app.logger.info('Call to paypal-create-payment')
    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {
            "payment_method": "paypal",
        },
        "redirect_urls": {
            "return_url": url_for('.paypal_execute_payment', _external=True),
            "cancel_url": current_app.config['STATIC_SITE_URL'] + '/{0}/buy.html'.format(g.get('lang_code', 'en')),
        },
        "transactions": [{
            "amount": {
                "total": PRICE_STRING,
                "currency": "USD",
            },
            "description": "Buckets v1 License",
        }],
        "note_to_payer": "I don't know why PayPal asks for a shipping address, and I don't know how to disable it.  Put in whatever you want :)"
    })
    created = payment.create()
    if created:
        for link in payment.links:
            if link.rel == 'approval_url':
                return redirect(link.href)

    flash('Error getting to paypal', 'error')
    return redirect(current_app.config['STATIC_SITE_URL'] + '/{0}/buy.html'.format(g.get('lang_code', 'en')))

@blue.route('/paypal-execute-payment', methods=['GET'])
def paypal_execute_payment():
    paymentId = request.args['paymentId']
    # token = request.args['token']
    payerid = request.args['PayerID']
    payment = paypalrestsdk.Payment.find(paymentId)
    import sys; sys.stdout.flush()

    try:
        email = payment.payer.payer_info.email
        if not email:
            flash(gettext('No email address provided.  Each license must be associated with an email address.  You were not charged.', 'error'))
            raise Exception('No email address provided')
    except:
        raise
    
    # generate the license
    try:
        license = generateLicense(email)
    except Exception:
        flash(gettext('Error generating license.  Your card was not charged.'), 'error')
        raise

    # charge them
    if payment.execute({"payer_id": payerid}):
        # successful payment
        flash(gettext('Payment received.'))
        emailLicense(email, license)
        return render_template('bought.html', license=license)
    else:
        flash(gettext("Error finalizing payment.  I don't think you were charged, but please email to see."), 'error')
        raise Exception(payment.error)

@blue.route('/paypal-return', methods=['GET'])
def paypal_return():
    raise Exception("You shouldn't ever get here")




@blue.route('/coupon', methods=['GET', 'POST'])
def coupon():
    if request.method == 'POST':
        # check input
        email1 = request.form.get('email1', None)
        if not email1:
            flash(gettext('No email address provided.  Each license must be associated with an email address.'), 'error')
        email2 = request.form.get('email2', None)
        if email1 != email2:
            flash(gettext('Email addresses do not match.'), 'error')
        coupon = request.form.get('coupon', None)
        if not coupon:
            flash(gettext("Invalid coupon."), 'error')
        
        return render_template('coupon.html')
    else:
        # present form
        return render_template('coupon.html')


