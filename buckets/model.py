from buckets.authn import UserManagement
from buckets.authz import BindableMultiAuth


def authProtectedAPI(engine):
    api = BindableMultiAuth()
    api.registerPolicy('user', UserManagement(engine).policy)
    return api
