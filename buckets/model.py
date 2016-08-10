from buckets.authn import UserManagement
from buckets.authz import BindableMultiAuth

from flask import url_for

def signin_urlmaker(token):
    return url_for('anon.auth', token=token, _external=True)


def authProtectedAPI(engine, mailer):
    api = BindableMultiAuth()
    api.registerPolicy('user',
        UserManagement(engine, mailer,
            signin_urlmaker=signin_urlmaker).policy)
    return api
