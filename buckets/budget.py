from sqlalchemy import select, and_, func

from buckets.schema import Account, Bucket, BucketTrans, Group
from buckets.authz import AuthPolicy, anything
from buckets.rank import rankBetween
from buckets.error import Error


class BudgetManagement(object):
    """
    This contains functions for working a farm
    """

    policy = AuthPolicy()

    def __init__(self, engine, farm_id):
        self.engine = engine
        self.farm_id = farm_id

    #----------------------------------------------------------
    # Account

    @policy.allow(anything)
    def create_account(self, name, balance=0):
        r = self.engine.execute(Account.insert()
            .values(farm_id=self.farm_id, name=name, balance=balance)
            .returning(Account))
        return dict(r.fetchone())

    @policy.allow(anything)
    def get_account(self, id):
        r = self.engine.execute(
            select([Account])
            .where(
                and_(
                    Account.c.id == id,
                    Account.c.farm_id == self.farm_id
                )))
        return dict(r.fetchone())

    @policy.allow(anything)
    def update_account(self, id, data):
        updatable = ['name', 'balance', 'currency']
        values = {}
        for key in updatable:
            val = data.get(key)
            if val is not None:
                values[key] = val
        self.engine.execute(Account.update()
            .values(**values)
            .where(and_(
                Account.c.id == id,
                Account.c.farm_id == self.farm_id
            )))
        return self.get_account(id)

    @policy.allow(anything)
    def list_accounts(self):
        r = self.engine.execute(select([Account])
            .where(Account.c.farm_id == self.farm_id))
        return [dict(x) for x in r.fetchall()]


    #----------------------------------------------------------
    # Group

    @policy.allow(anything)
    def create_group(self, name):
        r = self.engine.execute(select([
            func.max(Group.c.rank)])
            .where(Group.c.farm_id == self.farm_id))
        maxrank = r.fetchone()[0] or 'a'
        thisrank = rankBetween(maxrank, None)
        r = self.engine.execute(Group.insert()
            .values(
                farm_id=self.farm_id,
                rank=thisrank,
                name=name)
            .returning(Group))
        return dict(r.fetchone())

    @policy.allow(anything)
    def update_group(self, id, data):
        updatable = [
            'name',
            'rank',
        ]
        values = {}
        for key in updatable:
            val = data.get(key)
            if val is not None:
                values[key] = val

        if 'rank' in values:
            r = self.engine.execute(select([Group.c.id])
                .where(and_(
                    Group.c.rank == values['rank'],
                    Group.c.id != id,
                    Group.c.farm_id == self.farm_id,
                )))
            if r.fetchone():
                raise Error("Duplicate rank")

        self.engine.execute(Group.update()
            .values(**values)
            .where(and_(
                Group.c.id == id,
                Group.c.farm_id == self.farm_id
            )))
        return self.get_group(id)

    @policy.allow(anything)
    def get_group(self, id):
        r = self.engine.execute(
            select([Group])
            .where(
                and_(
                    Group.c.id == id,
                    Group.c.farm_id == self.farm_id
                )))
        return dict(r.fetchone())


    #----------------------------------------------------------
    # Bucket

    @policy.allow(anything)
    def create_bucket(self, name):
        r = self.engine.execute(Bucket.insert()
            .values(farm_id=self.farm_id,
                name=name)
            .returning(Bucket))
        return dict(r.fetchone())

    @policy.allow(anything)
    def get_bucket(self, id):
        r = self.engine.execute(
            select([Bucket])
            .where(
                and_(
                    Bucket.c.id == id,
                    Bucket.c.farm_id == self.farm_id
                )))
        return dict(r.fetchone())

    @policy.allow(anything)
    def update_bucket(self, id, data):
        updatable = [
            'name',
            'out_to_pasture',
            'kind',
            'deposit',
            'goal',
            'end_date']
        values = {}
        for key in updatable:
            val = data.get(key)
            if val is not None:
                values[key] = val
        self.engine.execute(Bucket.update()
            .values(**values)
            .where(and_(
                Bucket.c.id == id,
                Bucket.c.farm_id == self.farm_id
            )))
        return self.get_bucket(id)

    @policy.allow(anything)
    def list_buckets(self):
        r = self.engine.execute(select([Bucket])
            .where(Bucket.c.farm_id == self.farm_id))
        return [dict(x) for x in r.fetchall()]

    @policy.allow(anything)
    def bucket_transact(self, bucket_id, amount, memo='', posted=None):
        values = {
            'bucket_id': bucket_id,
            'amount': amount,
            'memo': memo,
        }
        if posted:
            values['posted'] = posted
        r = self.engine.execute(BucketTrans.insert()
            .values(**values)
            .returning(BucketTrans))
        return dict(r.fetchone())

