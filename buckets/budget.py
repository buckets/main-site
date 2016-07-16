from sqlalchemy import select

from buckets.schema import User
from buckets.authz import AuthPolicy, anything


class BudgetManagement(object):
    """
    This contains functions for working a farm
    """

    policy = AuthPolicy()

    def __init__(self, engine):
        self.engine = engine

    