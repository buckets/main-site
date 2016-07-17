"""
This module tests the budgeting aspects of buckets only.  No billing or
authentication or sign up or anything of that.
"""

import uuid
import pytest
from buckets.authn import UserManagement
from buckets.budget import BudgetManagement

@pytest.fixture
def user_api(engine):
    return UserManagement(engine)

@pytest.fixture
def user(user_api):
    email = '{0}@test.com'.format(uuid.uuid4())
    return user_api.create_user(email, 'testguy')

@pytest.fixture
def farm(user, user_api):
    return user_api.create_farm(user['id'])

@pytest.fixture
def api(farm, engine):
    return BudgetManagement(engine, farm['id'])


class TestAccount(object):

    def test_create(self, api):
        account = api.create_account('Checking')
        assert account['id'] is not None
        assert account['created'] is not None
        assert account['name'] == 'Checking'
        assert account['balance'] == 0
        assert account['currency'] == 'USD'

    def test_list(self, api):
        account = api.create_account('Savings')
        accounts = api.list_accounts()
        assert account in accounts
        assert len(accounts) == 1

    def test_update(self, api):
        account = api.create_account('Checking')
        new_account = api.update_account(account['id'],
            dict(name='IRA', balance=12, currency='ZWA'))
        assert new_account['name'] == 'IRA'
        assert new_account['balance'] == 12
        assert new_account['currency'] == 'ZWA'
        again = api.get_account(account['id'])
        assert again == new_account


