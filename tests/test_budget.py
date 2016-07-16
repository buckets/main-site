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
def api(engine):
    return BudgetManagement(engine)

