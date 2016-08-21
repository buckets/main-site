"""
This module tests functions that register and authenticate users.
"""

import uuid
import pytest
import six
from buckets.error import NotFound, VerificationError, Forbidden
from buckets.error import AccountLocked, DuplicateRegistration
from buckets.authn import UserManagement
from buckets.mailing import DebugMailer

from datetime import timedelta, date

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
    assert user['_pin'] is None
    assert user['last_login'] is None

def test_unique_email(api):
    email = random('hal', '@hal.com')
    api.create_user(email, 'hal')
    with pytest.raises(DuplicateRegistration):
        api.create_user(email, 'diffname')

def test_unique_lowercase_email(api):
    email = random('randall', '@hal.com')
    api.create_user(email, 'hal')
    with pytest.raises(DuplicateRegistration):
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
    assert farm['payer_id'] is None
    assert farm['service_expiration'] == date.today() + timedelta(days=90)
    assert len(farm['users']) == 1
    assert farm['users'][0]['id'] == user['id']
    assert farm['users'][0]['name'] == user['name']

def test_add_user_to_farm(api, mkuser):
    user1 = mkuser()
    user2 = mkuser()
    farm = api.create_farm(user1['id'], 'name')
    assert len(api.list_farms(user2['id'])) == 0
    api.add_user_to_farm(farm['id'], user2['id'])
    assert len(api.list_farms(user2['id'])) == 1
    api.remove_user_from_farm(farm['id'], user2['id'])
    assert len(api.list_farms(user2['id'])) == 0

def test_add_user_to_farm_twice(api, mkuser):
    assert False, "Write me"

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

def test_is_paid_for(api, mkuser, engine):
    user = mkuser()
    farm = api.create_farm(user['id'])
    assert api.is_paid_for(farm['id']) is True
    engine.execute("UPDATE farm set service_expiration='2001-01-01' where id=%s;",
        (farm['id'],))
    assert api.is_paid_for(farm['id']) is False

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

def test_set_pin(api, mkuser):
    user = mkuser()
    assert api.has_pin(user['id']) == False
    api.set_pin(user['id'], '19405')
    assert api.has_pin(user['id']) == True
    api.verify_pin(user['id'], '19405')

def test_set_pin_unicode(api, mkuser):
    user = mkuser()
    assert api.has_pin(user['id']) == False
    api.set_pin(user['id'], six.u('19405'))
    assert api.has_pin(user['id']) == True
    api.verify_pin(user['id'], six.u('19405'))

def test_verify_pin_wrong(api, mkuser):
    user = mkuser()
    api.set_pin(user['id'], '19405')
    with pytest.raises(VerificationError):
        api.verify_pin(user['id'], '20000')

def test_set_pin_no_overwrite(api, mkuser):
    user = mkuser()
    api.set_pin(user['id'], '19405')
    with pytest.raises(Forbidden):
        api.set_pin(user['id'], '29999')

def test_reset_pin(api, mkuser):
    user = mkuser()
    api.set_pin(user['id'], '2384')
    api.reset_pin(user['id'])
    assert api.has_pin(user['id']) == False
    api.set_pin(user['id'], '9999')
    assert api.has_pin(user['id']) == True
    api.verify_pin(user['id'], '9999')
    with pytest.raises(VerificationError):
        api.verify_pin(user['id'], '2384')

def test_verify_pin_too_many_attempts(api, mkuser):
    user = mkuser()
    api.set_pin(user['id'], '1234')
    for i in range(5):
        with pytest.raises(VerificationError):
            api.verify_pin(user['id'], '6666')
    
    # additional attempts fail
    with pytest.raises(AccountLocked):
        api.verify_pin(user['id'], '5555')

    # even the right one fails now
    with pytest.raises(AccountLocked):
        api.verify_pin(user['id'], '1234')

def test_verify_pin_attempts_reset_on_success(api, mkuser):
    user = mkuser()
    api.set_pin(user['id'], '1234')
    for i in range(4):
        with pytest.raises(VerificationError):
            api.verify_pin(user['id'], '6666')
    
    api.verify_pin(user['id'], '1234')

    # should reset the count
    with pytest.raises(VerificationError):
        api.verify_pin(user['id'], '5555')
    with pytest.raises(VerificationError):
        api.verify_pin(user['id'], '5555')
