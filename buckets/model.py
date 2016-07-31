from buckets.authn import UserManagement
from buckets.authz import BindableMultiAuth


def authProtectedAPI(engine, mailer):
    api = BindableMultiAuth()
    api.registerPolicy('user', UserManagement(engine, mailer).policy)
    return api
