from buckets.authn import UserManagement
from buckets.authz import BindableMultiAuth


def authProtectedAPI(engine, mailer, public_url):
    api = BindableMultiAuth()
    api.registerPolicy('user',
        UserManagement(engine, mailer, public_url).policy)
    return api
