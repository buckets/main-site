"""
This module tests functions that register and authenticate users.
"""

import uuid
import pytest
from buckets.error import NotFound
from buckets.authn import UserManagement
from buckets.mailing import DebugMailer

from datetime import timedelta

from sqlalchemy import func


@pytest.fixture
def mailer():
    return DebugMailer()

@pytest.fixture
def api(engine, mailer):
    return UserManagement(
        engine=engine,
        mailer=mailer,
        signin_urlmaker=lambda x:'HEY{0}'.format(x))

@pytest.fixture
def mkuser(api):
    def func():
        return api.create_user(random('', '@test.com'), 'test')
    return func


def random(prefix='', suffix=''):
    return '{0}{1}{2}'.format(prefix, uuid.uuid4(), suffix)


def test_create_user(api):
    email = random('jim','@jim.com')
    user = api.create_user(email, 'jim')
    assert user['id'] is not None
    assert user['email'] == email
    assert user['email_verified'] is False
    assert user['name'] == 'jim'
    assert user['created'] is not None
    assert user['want_newsletter'] == False
    assert user['intro_completed'] == False
    assert user['_pin'] is None
    assert user['last_login'] is None

def test_unique_email(api):
    email = random('hal', '@hal.com')
    api.create_user(email, 'hal')
    with pytest.raises(Exception):
        api.create_user(email, 'diffname')

def test_unique_lowercase_email(api):
    email = random('randall', '@hal.com')
    api.create_user(email, 'hal')
    with pytest.raises(Exception):
        api.create_user(email.upper(), 'diffname')

def test_get_user(api):
    created = api.create_user(random('bob', '@bob.com'), 'bob')
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

def test_signin(api, mailer, mkuser):
    user = mkuser()
    api.send_signin_email(user['email'])
    assert len(mailer.calls) == 1, "Should have sent an email"
    method, args, kwargs = mailer.calls[0]
    assert method == 'sendTemplate'
    assert kwargs['template_name'] == 'login'
    assert kwargs['to_email'] == user['email']
    
    data = kwargs['data']
    assert 'signin_url' in data

    assert data['signin_url'].startswith('HEY')
    token = data['signin_url'][len('HEY'):]

    found = api.user_id_from_signin_token(token)
    assert found == user['id']

def test_signin_no_such_email(api, mailer):
    api.send_signin_email('nosuchemail@email.com')
    assert len(mailer.calls) == 0, "No email sent"

def test_user_id_from_signin_token_bad_token(api, mkuser):
    with pytest.raises(NotFound):
        api.user_id_from_signin_token('garbage')

def test_user_id_from_signin_token(api, mkuser):
    user = mkuser()
    token = api.generate_signin_token(user['id'])
    user_id = api.user_id_from_signin_token(token)
    assert user_id == user['id']

def test_signin_tokens_expire(api, mkuser):
    user = mkuser()
    token = api.generate_signin_token(user['id'], _lifespan=1)
    with pytest.raises(NotFound):
        api.user_id_from_signin_token(token,
            _now=func.now()+timedelta(seconds=2))

def test_signin_token_no_such_email(api):
    with pytest.raises(NotFound):
        api.generate_signin_token(-1)

