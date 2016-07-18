"""
This module tests the budgeting aspects of buckets only.  No billing or
authentication or sign up or anything of that.
"""

import uuid
from datetime import date, datetime
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


class TestBucket(object):

    def test_create(self, api):
        bucket = api.create_bucket('Food')
        assert bucket['id'] is not None
        assert bucket['created'] is not None
        assert bucket['name'] == 'Food'
        assert bucket['balance'] == 0
        assert bucket['out_to_pasture'] == False
        assert bucket['group_id'] is None
        assert bucket['group_rank'] == 0
        assert bucket['kind'] == ''
        assert bucket['goal'] == None
        assert bucket['end_date'] == None
        assert bucket['deposit'] == None

    def test_list(self, api):
        bucket = api.create_bucket('Clothing')
        buckets = api.list_buckets()
        assert bucket in buckets
        assert len(buckets) == 1

    def test_update(self, api):
        bucket = api.create_bucket('Food')
        new_bucket = api.update_bucket(bucket['id'],
            {
                'name': 'Stuff',
                'out_to_pasture': True,
                'kind': 'deposit',
                'deposit': 100,
            })
        assert new_bucket['name'] == 'Stuff'
        assert new_bucket['out_to_pasture'] is True
        assert new_bucket['kind'] == 'deposit'
        assert new_bucket['deposit'] == 100
        again = api.get_bucket(bucket['id'])
        assert again == new_bucket

    def test_transact(self, api):
        bucket = api.create_bucket('Food')
        trans = api.bucket_transact(bucket['id'], amount=100,
            memo='some memo', posted=date(2000, 1, 1))
        assert trans['bucket_id'] == bucket['id']
        assert trans['amount'] == 100
        assert trans['memo'] == 'some memo'
        assert trans['posted'] == datetime(2000, 1, 1)
        assert trans['created'] is not None
        assert trans['id'] is not None

        bucket = api.get_bucket(bucket['id'])
        assert bucket['balance'] == 100
