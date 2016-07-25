"""
This module tests the budgeting aspects of buckets only.  No billing or
authentication or sign up or anything of that.
"""

import uuid
from datetime import date, datetime
import pytest
import requests

from mock import create_autospec, MagicMock

from buckets.authn import UserManagement
from buckets.budget import BudgetManagement, hashStrings
from buckets.error import Error

@pytest.fixture
def user_api(engine):
    return UserManagement(engine)

@pytest.fixture
def fake_requests():
    return create_autospec(requests)

@pytest.fixture
def user(user_api):
    email = '{0}@test.com'.format(uuid.uuid4())
    return user_api.create_user(email, 'testguy')

@pytest.fixture
def farm(user, user_api):
    return user_api.create_farm(user['id'])

@pytest.fixture
def api(farm, engine, fake_requests):
    return BudgetManagement(engine, farm['id'],
        _requests=fake_requests)


class TestAccount(object):

    def test_create(self, api):
        account = api.create_account('Checking')
        assert account['id'] is not None
        assert account['created'] is not None
        assert account['name'] == 'Checking'
        assert account['balance'] == 0
        assert account['currency'] == 'USD'

    def test_has(self, api):
        assert api.has_accounts() is False
        api.create_account('Clothing')
        assert api.has_accounts() is True

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

    def test_transact(self, api):
        account = api.create_account('Checking')

        assert api.has_transactions() is False
        trans = api.account_transact(account['id'], amount=100,
            memo='some memo', posted=date(2000, 1, 1))
        assert trans['account_id'] == account['id']
        assert trans['amount'] == 100
        assert trans['memo'] == 'some memo'
        assert trans['posted'] == datetime(2000, 1, 1)
        assert trans['created'] is not None
        assert trans['id'] is not None
        assert trans['fi_id'] is None
        assert trans['cat_likely'] == False
        assert trans['skip_cat'] == False
        assert trans['buckets'] == []
        assert api.has_transactions() is True

        account = api.get_account(account['id'])
        assert account['balance'] == 100

    def test_transact_stringdate(self, api):
        account = api.create_account('Checking')
        trans = api.account_transact(account['id'], amount=100,
            posted='2000-01-01')
        assert trans['posted'] == datetime(2000, 1, 1)


class TestTransaction(object):

    def test_categorize(self, api):
        account = api.create_account('Checking')
        for i in range(10):
            api.create_bucket('throwaway')
        b1 = api.create_bucket('Bucket1')
        b2 = api.create_bucket('Bucket2')
        trans = api.account_transact(account['id'], amount=500,
            memo='fizzballs')

        new_trans = api.categorize(trans['id'], buckets=[
            {'bucket_id': b1['id'], 'amount': 400},
            {'bucket_id': b2['id']},
        ])
        assert new_trans['cat_likely'] == True
        assert len(new_trans['buckets']) == 2
        assert {'bucket_id': b1['id'], 'amount': 400} in new_trans['buckets']
        assert {'bucket_id': b2['id'], 'amount': 100} in new_trans['buckets']

        transactions = api.list_account_trans()
        assert new_trans in transactions

    def test_re_categorize(self, api):
        account = api.create_account('Checking')
        b1 = api.create_bucket('Bucket1')

        b2 = api.create_bucket('Bucket2')
        trans = api.account_transact(account['id'], amount=500,
            memo='fizzballs')
        new_trans = api.categorize(trans['id'], buckets=[
            {'bucket_id': b1['id']},
        ])
        new_trans = api.categorize(trans['id'], buckets=[
            {'bucket_id': b2['id']},
        ])
        assert new_trans['cat_likely'] == True
        assert len(new_trans['buckets']) == 1
        assert {'bucket_id': b2['id'], 'amount': 500} in new_trans['buckets']

        b1 = api.get_bucket(b1['id'])
        assert b1['balance'] == 0, "Should restore bucket1 balance"
        b2 = api.get_bucket(b2['id'])
        assert b2['balance'] == 500, "Should change b2 balance"

    def test_signs_positive_okay(self, api):
        account = api.create_account('Checking')
        b1 = api.create_bucket('Bucket1')
        b2 = api.create_bucket('Bucket2')
        trans = api.account_transact(account['id'], amount=-500,
            memo='fizzballs')

        new_trans = api.categorize(trans['id'], buckets=[
            {'bucket_id': b1['id'], 'amount': 400},
            {'bucket_id': b2['id']},
        ])
        assert new_trans['cat_likely'] == True
        assert len(new_trans['buckets']) == 2
        assert {'bucket_id': b1['id'], 'amount': -400} in new_trans['buckets']
        assert {'bucket_id': b2['id'], 'amount': -100} in new_trans['buckets']

    def test_categorize_too_much(self, api):
        account = api.create_account('Checking')
        b1 = api.create_bucket('Bucket1')
        b2 = api.create_bucket('Bucket2')
        trans = api.account_transact(account['id'], amount=500,
            memo='fizzballs')

        with pytest.raises(Error):
            api.categorize(trans['id'], buckets=[
                {'bucket_id': b1['id'], 'amount': 600},
                {'bucket_id': b2['id']},
            ])

        b1 = api.get_bucket(b1['id'])
        assert b1['balance'] == 0, "Should not have made the trans"
        b2 = api.get_bucket(b2['id'])
        assert b2['balance'] == 0, "Should not have made the trans"
        trans = api.get_account_trans(trans['id'])
        assert trans['buckets'] == []

    def test_skip(self, api):
        account = api.create_account('Checking')
        trans = api.account_transact(account['id'], amount=500,
            memo='fizzballs')
        new_trans = api.skip_categorizing(trans['id'])
        assert new_trans['id'] == trans['id']
        assert new_trans['skip_cat'] is True
        assert new_trans['cat_likely'] is True

    def test_skip_after_cat(self, api):
        account = api.create_account('Checking')
        trans = api.account_transact(account['id'], amount=500,
            memo='fizzballs')
        b1 = api.create_bucket('Bucket1')
        api.categorize(trans['id'], buckets=[
            {'bucket_id': b1['id']},
        ])
        new_trans = api.skip_categorizing(trans['id'])
        assert new_trans['skip_cat'] is True
        assert new_trans['buckets'] == [], "Should have removed categories"
        assert new_trans['cat_likely'] is True

    def test_cat_after_skip(self, api):
        account = api.create_account('Checking')
        trans = api.account_transact(account['id'], amount=500,
            memo='fizzballs')
        api.skip_categorizing(trans['id'])
        b1 = api.create_bucket('Bucket1')
        new_trans = api.categorize(trans['id'], buckets=[
            {'bucket_id': b1['id']},
        ])
        assert new_trans['skip_cat'] is False
        assert new_trans['cat_likely'] is True


class TestGroup(object):

    def test_create(self, api):
        group = api.create_group('Something')
        assert group['id'] is not None
        assert group['created'] is not None
        assert group['farm_id'] == api.farm_id
        assert group['name'] == 'Something'
        assert group['ranking'] is not None

    def test_create_rank(self, api):
        group1 = api.create_group('First')
        group2 = api.create_group('Second')
        group3 = api.create_group('Third')
        assert group1['ranking'] < group2['ranking']
        assert group2['ranking'] < group3['ranking']

    def test_update(self, api):
        group = api.create_group('Hello')
        new = api.update_group(group['id'], {
            'name': 'Something',
            'ranking': 'h',
        })
        assert new['id'] == group['id']
        assert new['name'] == 'Something'
        assert new['ranking'] == 'h'
        again = api.get_group(group['id'])
        assert new == again

    def test_update_samerank(self, api):
        """
        It's an error to have groups with the same ranking.
        """
        group1 = api.create_group('a')
        group2 = api.create_group('b')
        with pytest.raises(Error):
            api.update_group(group1['id'], {
                'ranking': group2['ranking'],
            })

    def test_list_groups(self, api):
        group = api.create_group('a')
        groups = api.list_groups()
        assert group in groups
        assert len(groups) == 1

    def test_move_group(self, api):
        a = api.create_group('a')
        b = api.create_group('b')
        assert b['ranking'] > a['ranking']
        a = api.move_group(a['id'], after_group=b['id'])
        assert a['ranking'] > b['ranking']

    def test_move_group_between(self, api):
        a = api.create_group('a')
        b = api.create_group('b')
        c = api.create_group('c')
        a = api.move_group(a['id'], after_group=b['id'])
        assert a['ranking'] > b['ranking']
        assert a['ranking'] < c['ranking']


class TestBucket(object):

    def test_create(self, api):
        bucket = api.create_bucket('Food')
        assert bucket['id'] is not None
        assert bucket['created'] is not None
        assert bucket['farm_id'] == api.farm_id
        assert bucket['name'] == 'Food'
        assert bucket['balance'] == 0
        assert bucket['out_to_pasture'] == False
        assert bucket['group_id'] is None
        assert bucket['ranking'] is not None
        assert bucket['kind'] == ''
        assert bucket['goal'] == None
        assert bucket['end_date'] == None
        assert bucket['deposit'] == None

    def test_has(self, api):
        assert api.has_buckets() == 0
        api.create_bucket('Clothing')
        assert api.has_buckets() is True

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
                'color': '#ffffff',
            })
        assert new_bucket['name'] == 'Stuff'
        assert new_bucket['out_to_pasture'] is True
        assert new_bucket['kind'] == 'deposit'
        assert new_bucket['deposit'] == 100
        assert new_bucket['color'] == '#ffffff'
        again = api.get_bucket(bucket['id'])
        assert again == new_bucket

    def test_move_bucket_after(self, api):
        b1 = api.create_bucket('b1')
        b2 = api.create_bucket('b2')
        b1 = api.move_bucket(b1['id'], after_bucket=b2['id'])
        assert b1['ranking'] > b2['ranking']

    def test_move_bucket_after_another_group(self, api):
        g = api.create_group('Group')
        b1 = api.create_bucket('b1')
        b2 = api.create_bucket('b2')

        b1 = api.move_bucket(b1['id'], group_id=g['id'])
        b2 = api.move_bucket(b2['id'], after_bucket=b1['id'])
        assert b2['group_id'] == g['id'], "Should update group"
        assert b2['ranking'] > b1['ranking']

    def test_move_bucket_after_between(self, api):
        g = api.create_group('Group')
        b1 = api.create_bucket('b1')
        b2 = api.create_bucket('b2')
        b3 = api.create_bucket('b3')

        for b in [b3,b2,b1]:
            api.move_bucket(b['id'], group_id=g['id'])

        b1 = api.move_bucket(b1['id'], after_bucket=b2['id'])
        b2 = api.get_bucket(b2['id'])
        b3 = api.get_bucket(b3['id'])
        assert b1['ranking'] > b2['ranking']
        assert b1['ranking'] < b3['ranking']

    def test_move_bucket_to_group(self, api):
        group = api.create_group('a')
        bucket = api.create_bucket('bucket1')
        new_bucket = api.move_bucket(bucket['id'], group_id=group['id'])
        assert new_bucket['group_id'] == group['id']
        assert new_bucket['ranking'] is not None

    def test_move_bucket_to_group_beginning(self, api):
        group = api.create_group('a')
        b1 = api.create_bucket('bucket1')
        b2 = api.create_bucket('bucket2')
        b2 = api.move_bucket(b2['id'], group_id=group['id'])
        b1 = api.move_bucket(b1['id'], group_id=group['id'])
        assert b1['ranking'] < b2['ranking']

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

    def test_transact_stringdate(self, api):
        bucket = api.create_bucket('Food')
        trans = api.bucket_transact(bucket['id'], amount=100,
            posted='2000-01-01')
        assert trans['posted'] == datetime(2000, 1, 1)


class TestSimpleFIN(object):

    def test_claim(self, api, fake_requests):
        """
        You can claim a simplefin setup token.
        """
        assert api.has_connections() is False

        fake_requests.post.return_value = MagicMock(
            text='https://foo:bar@example.com')
        connection = api.simplefin_claim(
            'https://example.com/abcdefg'.encode('base64'))
        fake_requests.post.assert_called_once_with('https://example.com/abcdefg')
        assert connection['id'] is not None
        assert connection['farm_id'] == api.farm_id
        assert connection['access_token'] == 'https://foo:bar@example.com'
        assert connection['created'] is not None
        assert connection['last_used'] is None

        assert api.has_connections() is True

    def test_fetch_andMatch(self, api, fake_requests):
        """
        You can use an already-claimed simplefin token to get some data.
        """
        fake_requests.post.return_value = MagicMock(
            text='https://foo:bar@example.com')
        api.simplefin_claim(
            'https://example.com/abcdefg'.encode('base64'))

        fake_requests.get.return_value = MagicMock(json=lambda:{
            'accounts': [
                {
                  "org": {
                    "name": "My Bank",
                    "domain": "mybank.com",
                    "sfin-url": "https://sfin.mybank.com"
                  },
                  "id": "2930002",
                  "name": "Savings",
                  "currency": "USD",
                  "balance": "100.23",
                  "available-balance": "75.23",
                  "balance-date": 978366153,
                  "transactions": [
                    {
                        "id": "123456",
                        "amount": "-25.00",
                        "posted": 793090572,
                        "description": "Somewhere",
                    }
                  ]
                }
            ]
        })
        result = api.simplefin_fetch()
        args, kwargs = fake_requests.get.call_args
        assert args[0] == 'https://example.com/accounts'
        assert len(result['unknown_accounts']) == 1

        acct = result['unknown_accounts'][0]
        assert acct['id'] == '2930002'
        assert acct['name'] == 'Savings'
        assert acct['organization'] == 'My Bank'
        assert acct['hash'] == hashStrings(
            [acct['organization'], acct['id']])

        conns = api.simplefin_list_connections()
        assert len(conns) == 1
        assert conns[0]['last_used'] is not None

        # now match it up
        account = api.create_account('Savings')
        api.add_account_hash(account['id'], acct['hash'])

        # run fetch again to get the transactions
        result = api.simplefin_fetch()
        assert len(result['unknown_accounts']) == 0
        assert len(result['accounts']) == 1
        ret = result['accounts'][0]
        assert ret['id'] == account['id']
        trans = ret['transactions'][0]
        assert trans['account_id'] == account['id']
        assert trans['amount'] == -2500
        assert trans['memo'] == 'Somewhere'
        assert trans['fi_id'] == '123456'

        # check account balance
        account = api.get_account(account['id'])
        assert account['balance'] == 10023
