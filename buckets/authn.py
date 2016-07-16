from sqlalchemy import select, and_

from buckets.schema import User, Farm, UserFarm
from buckets.authz import AuthPolicy, anything


class UserManagement(object):
    """
    This contains functions for user management
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
        return dict(row)

    @policy.allow(anything)
    def get_user(self, id):
        r = self.engine.execute(select([User])
            .where(User.c.id == id))
        row = r.fetchone()
        return dict(row)

    @policy.allow(anything)
    def create_farm(self, creator_id, name):
        with self.engine.begin() as conn:
            r = conn.execute(Farm.insert()
                .values(name=name, creator_id=creator_id)
                .returning(Farm.c.id))
            row = r.fetchone()
            farm_id = row[0]
            conn.execute(UserFarm.insert()
                .values(farm_id=farm_id, user_id=creator_id))
        return self.get_farm(farm_id)

    def get_farm(self, id):
        r = self.engine.execute(
            select([Farm])
            .where(Farm.c.id == id))
        farm = dict(r.fetchone())
        r = self.engine.execute(
            select([User.c.id, User.c.name])
            .where(and_(
                User.c.id == UserFarm.c.user_id,
                UserFarm.c.farm_id == id)))
        farm['users'] = [dict(x) for x in r.fetchall()]
        return farm
