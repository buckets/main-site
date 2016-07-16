from buckets.authn import NoAuthUser
from buckets.authz import BindableMultiAuth


def authProtectedAPI(engine):
    api = BindableMultiAuth()
    api.registerPolicy('anon', NoAuthUser(engine).policy)
    return api
