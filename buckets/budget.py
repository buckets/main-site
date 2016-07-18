from sqlalchemy import select, and_

from buckets.schema import Account, Bucket, BucketTrans
from buckets.authz import AuthPolicy, anything


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
        updatable = ['name', 'out_to_pasture', 'kind', 'deposit']
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

