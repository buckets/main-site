"""
This module tests functions that register and authenticate users.
"""

import pytest
from buckets.authn import NoAuthUser


@pytest.fixture
def api(engine):
    return NoAuthUser(engine)


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
