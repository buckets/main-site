"""
This module tests functions that register and authenticate users.
"""

import uuid
import pytest
from buckets.authn import UserManagement




@pytest.fixture
def api(engine):
    return UserManagement(engine)

@pytest.fixture
def mkuser(api):
    def func():
        return api.create_user('{0}@test.com'.format(uuid.uuid4()),
            'test')
    return func


def test_create_user(api):
    user = api.create_user('jim@jim.com', 'jim')
    assert user['id'] is not None
    assert user['email'] == 'jim@jim.com'
    assert user['email_verified'] is False
    assert user['name'] == 'jim'
    assert user['created'] is not None
    assert user['want_newsletter'] == False
    assert user['intro_completed'] == False
    assert user['_pin'] is None
    assert user['last_login'] is None

def test_unique_email(api):
    api.create_user('hal@hal.com', 'hal')
    with pytest.raises(Exception):
        api.create_user('hal@hal.com', 'diffname')

def test_unique_lowercase_email(api):
    api.create_user('randall@hal.com', 'hal')
    with pytest.raises(Exception):
        api.create_user('RAnDALL@hal.com', 'diffname')

def test_get_user(api):
    created = api.create_user('bob@bob.com', 'bob')
    fetched = api.get_user(created['id'])
    assert fetched == created

def test_create_farm(api, mkuser):
    user = mkuser()
    farm = api.create_farm(user['id'], 'name')
    assert farm['id'] is not None
    assert farm['created'] is not None
    assert farm['name'] == 'name'
    assert farm['creator_id'] == user['id']
    assert len(farm['users']) == 1
    assert farm['users'][0]['id'] == user['id']
    assert farm['users'][0]['name'] == user['name']

def test_list_farms(api, mkuser):
    user = mkuser()
    farm = api.create_farm(user['id'])
    farms = api.list_farms(user['id'])
    assert len(farms) == 1
    assert farm in farms

def test_create_farm_default_name(api, mkuser):
    user = mkuser()
    farm = api.create_farm(user['id'])
    assert farm['name'] == 'Family'



