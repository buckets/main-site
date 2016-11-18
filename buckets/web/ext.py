from flask import Blueprint, g, request
from buckets.billing import BillingManagement
import stripe
import structlog
logger = structlog.get_logger()

blue = Blueprint('ext', __name__)

@blue.route('/stripe', methods=['POST'])
def stripe_webhook():
    data = request.get_json()
    event_type = data.get('type', None)
    event = data.get('data', {})
    if event_type in ['customer.subscription.updated',
                      'customer.subscription.deleted',
                      'customer.subscription.created']:
        logger.info('customer.subscription.*')
        api = BillingManagement(g.conn, stripe)
        sub_id = event['object']['id']
        log = logger.bind(subscription_id=sub_id)
        api.sync_service_expiration(sub_id)
        log.info('sync_service_expiration done')
    else:
        return 'Thanks, Stripe'