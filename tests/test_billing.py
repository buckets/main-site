"""
This module tests billing functions.
"""
from __future__ import print_function

import os
import uuid
import pytest
import stripe as _stripelib
from buckets.billing import BillingManagement
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
def mkuser(engine):
    user_api = UserManagement(engine, None, None)
    def func():
        return user_api.create_user(random('', '@test.com'), 'test')
    return func

def creditcard(self, number='4242424242424242'):
    return _stripelib.Token.create(
      card={
        "number": number,
        "exp_month": 12,
        "exp_year": 2020,
        "cvc": '123'
      },
    ).id

def random(prefix='', suffix=''):
    return '{0}{1}{2}'.format(prefix, uuid.uuid4(), suffix)


def test_set_credit_card(api, mkuser):
    user = mkuser()
    assert api.has_current_payment_method(user['id']) is False
    api.set_credit_card(user['id'], creditcard())
    assert api.has_current_payment_method(user['id']) is True
    cc_details = api.stripe_customer(user['id'])
    assert cc_details['last4'] == '4242'
    assert cc_details['exp_year'] == 2020
    assert cc_details['exp_month'] == 12

def test_set_credit_card_update():
    user = mkuser()
    api.set_credit_card(user['id'], creditcard())
    c1 = api.stripe_customer(user['id'])
    api.set_credit_card(user['id'], creditcard('4111111111111111'))
    c2 = api.stripe_customer(user['id'])
    assert c1.id == c2.id, "Should reuse the customer"
    cc_details = api.stripe_customer(user['id'])
    assert cc_details['last4'] == '1111'
    assert cc_details['exp_year'] == 2020
    assert cc_details['exp_month'] == 12

def test_has_current_payment_method():
    assert False, "write me"

def test_set_subscription():
    assert False, "write me"

def test_set_subscription_change():
    assert False, "write me"

def test_cancel_subscription():
    assert False, "write me"

def test_is_paid_for():
    assert False, "write me"

def test_get_billing_status():
    assert False, "write me for a farm"
