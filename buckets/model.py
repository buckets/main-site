from buckets.authn import UserManagement
from buckets.authz import BindableMultiAuth
from buckets.billing import BillingManagement

from flask import url_for

def signin_urlmaker(token):
    return url_for('anon.auth', token=token, _external=True)


def authProtectedAPI(engine, mailer, stripe):
    api = BindableMultiAuth()
    api.registerPolicy('user',
        UserManagement(engine, mailer,
            signin_urlmaker=signin_urlmaker).policy)
    api.registerPolicy('billing',
        BillingManagement(engine, stripe).policy)
    return api
