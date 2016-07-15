
from buckets.schema import User


class NoAuthUser(object):
    """
    This contains functions for authenticated users.
    """

    def __init__(self, engine):
        self.engine = engine


    def create_user(self, email, name):
        r = self.engine.execute(User.insert()
            .values(email=email, name=name)
            .returning(User))
        row = r.fetchone()
        return row
