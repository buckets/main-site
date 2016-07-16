
from buckets.schema import User
from buckets.authz import AuthPolicy, anything


class NoAuthUser(object):
    """
    This contains functions for authenticated users.
    """

    policy = AuthPolicy()

    def __init__(self, engine):
        self.engine = engine

    @policy.allow(anything)
    def create_user(self, email, name):
        email = email.lower()
        r = self.engine.execute(User.insert()
            .values(email=email, name=name)
            .returning(User))
        row = r.fetchone()
        return row
