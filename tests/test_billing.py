"""
This module tests billing functions.
"""
from __future__ import print_function

import os
import uuid
import pytest
import stripe as _stripelib

from buckets.error import NotFound
from buckets.billing import BillingManagement, unix2date
from buckets.authn import UserManagement

@pytest.fixture(scope='module')
def stripe():
    STRIPE_API_KEY = os.getenv('STRIPE_API_KEY', '')
    if not STRIPE_API_KEY:
        pytest.skip(
            'You must provide STRIPE_API_KEY.')
    elif 'test' not in STRIPE_API_KEY:
        raise Exception('You may not use a live STRIPE_API_KEY')
    else:
        _stripelib.api_key = STRIPE_API_KEY
    return _stripelib

@pytest.yield_fixture(autouse=True, scope='module')
def cleanup_stripe(stripe):
    BillingManagement(None, stripe=stripe).sync_plans_with_stripe()
    yield
    try:
        customers = list(stripe.Customer.list())
        for customer in customers:
            customer.delete()
    except Exception as e:
        print('Error deleting customers', e)

@pytest.fixture
def api(engine, stripe):
    return BillingManagement(engine=engine, stripe=stripe)

@pytest.fixture
def user_api(engine):
    return UserManagement(engine, None, None)

@pytest.fixture
def mkuser(user_api):
    def func():
        return user_api.create_user(random('', '@test.com'), 'test')
    return func

def creditcard(number='4242424242424242', exp_month=12, exp_year=2020):
    return _stripelib.Token.create(
      card={
        "number": number,
        "exp_month": exp_month,
        "exp_year": exp_year,
        "cvc": '123'
      },
    ).id

def random(prefix='', suffix=''):
    return '{0}{1}{2}'.format(prefix, uuid.uuid4(), suffix)


def test_set_credit_card(api, mkuser):
    user = mkuser()
    assert api.current_payment_method(user['id']) is None
    api.set_credit_card(user['id'], creditcard())
    card = api.current_payment_method(user['id'])
    assert card['last4'] == '4242'
    assert card['exp_year'] == 2020
    assert card['exp_month'] == 12

def test_set_credit_card_update(api, mkuser):
    # set it once
    user = mkuser()
    api.set_credit_card(user['id'], creditcard())
    c1 = api.stripe_customer(user['id'])
    
    # set it again
    api.set_credit_card(user['id'], creditcard('4111111111111111',
        exp_month=8, exp_year=2021))
    c2 = api.stripe_customer(user['id'])
    assert c1.id == c2.id, "Should reuse the customer"
    card = api.current_payment_method(user['id'])
    assert card['last4'] == '1111'
    assert card['exp_year'] == 2021
    assert card['exp_month'] == 8

def test_set_subscription(api, mkuser, user_api):
    user = mkuser()
    farm = user_api.create_farm(user['id'])
    api.set_credit_card(user['id'], creditcard())
    returned_sub = api.set_subscription(user['id'], farm['id'], 'monthly')
    cu = api.stripe_customer(user['id'])
    assert cu.subscriptions.total_count == 1, "Should have a subscription"
    sub = list(cu.subscriptions)[0]
    assert returned_sub.id == sub.id
    assert returned_sub.id == api.get_subscription(farm['id']).id
    assert sub.plan.id == api.PLANS['monthly']['id']
    assert sub.quantity == 1

    farm = user_api.get_farm(farm['id'])
    assert farm['payer_id'] == user['id']
    assert farm['service_expiration'] == unix2date(sub['current_period_end']).date()
    assert farm['_stripe_sub_id'] == sub['id']

def test_set_subscription_change_plan(api, mkuser, user_api):
    user = mkuser()
    farm = user_api.create_farm(user['id'])
    api.set_credit_card(user['id'], creditcard())
    api.set_subscription(user['id'], farm['id'], 'monthly')
    api.set_subscription(user['id'], farm['id'], 'yearly')

    cu = api.stripe_customer(user['id'])
    assert cu.subscriptions.total_count == 1, "Should have 1 subscription"
    sub = list(cu.subscriptions)[0]
    assert sub.plan.id == api.PLANS['yearly']['id']
    assert sub.quantity == 1

    farm = user_api.get_farm(farm['id'])
    assert farm['payer_id'] == user['id']
    assert farm['service_expiration'] == unix2date(sub['current_period_end']).date()
    assert farm['_stripe_sub_id'] == sub['id']

def test_set_subscription_change_user(api, mkuser, user_api):
    user1 = mkuser()
    user2 = mkuser()
    farm = user_api.create_farm(user1['id'])
    user_api.add_user_to_farm(farm['id'], user2['id'])

    api.set_credit_card(user1['id'], creditcard())
    api.set_credit_card(user2['id'], creditcard())

    api.set_subscription(user1['id'], farm['id'], 'monthly')
    api.set_subscription(user2['id'], farm['id'], 'monthly')

    cu1 = api.stripe_customer(user1['id'])
    assert cu1.subscriptions.total_count == 0, "Should have canceled the subscription"

    cu2 = api.stripe_customer(user2['id'])
    sub = list(cu2.subscriptions)[0]
    assert sub.plan.id == api.PLANS['monthly']['id']
    assert sub.quantity == 1

    farm = user_api.get_farm(farm['id'])
    assert farm['payer_id'] == user2['id']
    assert farm['service_expiration'] == unix2date(sub['current_period_end']).date()
    assert farm['_stripe_sub_id'] == sub['id']

def test_set_subscription_user_with_access_only(api, mkuser, user_api):
    """
    Only users with access to a farm can pay for it.  When you
    figure out gift cards/payments, you can change this.
    """
    user1 = mkuser()
    user2 = mkuser()
    farm = user_api.create_farm(user1['id'])

    api.set_credit_card(user1['id'], creditcard())
    api.set_credit_card(user2['id'], creditcard())

    api.set_subscription(user1['id'], farm['id'], 'monthly')
    with pytest.raises(NotFound):
        api.set_subscription(user2['id'], farm['id'], 'monthly')

    cu1 = api.stripe_customer(user1['id'])
    assert cu1.subscriptions.total_count == 1, "Should keep the subscription"

def test_cancel_subscription(mkuser, api, user_api):
    user = mkuser()
    farm = user_api.create_farm(user['id'])
    api.set_credit_card(user['id'], creditcard())
    api.set_subscription(user['id'], farm['id'], 'monthly')
    sub = api.cancel_subscription(farm['id'])

    cu = api.stripe_customer(user['id'])
    assert cu.subscriptions.total_count == 0, "Should have canceled the sub"
    
    farm = user_api.get_farm(farm['id'])
    assert farm['payer_id'] == user['id']
    assert farm['service_expiration'] == unix2date(sub['current_period_end']).date()
    assert farm['_stripe_sub_id'] == sub['id']

def test_sync_service_expiration(mkuser, api, user_api, engine):
    user = mkuser()
    farm = user_api.create_farm(user['id'])
    api.set_credit_card(user['id'], creditcard())
    api.set_subscription(user['id'], farm['id'], 'monthly')
    sub = api.cancel_subscription(farm['id'])

    cu = api.stripe_customer(user['id'])
    assert cu.subscriptions.total_count == 0, "Should have canceled the sub"
    
    engine.execute('UPDATE farm set service_expiration = null where id=%s',
        (farm['id'],))

    api.sync_service_expiration(subscription_id=sub['id'])

    farm = user_api.get_farm(farm['id'])
    assert farm['payer_id'] == user['id']
    assert farm['service_expiration'] == unix2date(sub['current_period_end']).date()
    assert farm['_stripe_sub_id'] == sub['id']
