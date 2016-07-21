import sqlalchemy
from sqlalchemy import select, and_, func

from buckets.schema import Account, Bucket, BucketTrans, Group
from buckets.authz import AuthPolicy, anything
from buckets.rank import rankBetween
from buckets.error import Error, NotFound


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
        row = r.fetchone()
        if not row:
            raise NotFound()
        return dict(row)

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

        # if 'rank' in values:
        #     r = self.engine.execute(select([Group.c.id])
        #         .where(and_(
        #             Group.c.rank == values['rank'],
        #             Group.c.id != id,
        #             Group.c.farm_id == self.farm_id,
        #         )))
        #     if r.fetchone():
        #         raise Error("Duplicate rank")

        try:
            self.engine.execute(Group.update()
                .values(**values)
                .where(and_(
                    Group.c.id == id,
                    Group.c.farm_id == self.farm_id
                )))
        except sqlalchemy.exc.IntegrityError:
            raise Error("Duplicate rank")
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
        row = r.fetchone()
        if not row:
            raise NotFound()
        return dict(row)

    @policy.allow(anything)
    def list_groups(self):
        r = self.engine.execute(
            select([Group])
            .where(Group.c.farm_id == self.farm_id)
            .order_by(Group.c.rank))
        return [dict(x) for x in r.fetchall()]

    @policy.allow(anything)
    def move_bucket(self, bucket_id, after_bucket=None, group_id=None):
        if group_id and after_bucket:
            raise Error("Either supply after_bucket or group_id; not both")

        self.get_bucket(bucket_id)

        if after_bucket:
            # move after bucket
            after = self.get_bucket(after_bucket)
            rank_start = after['rank']
            rank_end = None

            r = self.engine.execute(select([
                Bucket.c.rank])
                .where(and_(
                    Bucket.c.group_id == after['group_id'],
                    Bucket.c.farm_id == self.farm_id,
                    Bucket.c.rank > after['rank'],
                ))
                .order_by(Bucket.c.rank)
                .limit(1))
            row = r.fetchone()
            if row:
                rank_end = row[0]

            new_rank = rankBetween(rank_start, rank_end)
            return self.update_bucket(bucket_id, {
                'rank': new_rank,
                'group_id': after['group_id'],
            })

        elif group_id:
            # move to end of group
            self.get_group(group_id)

            r = self.engine.execute(select([func.max(Bucket.c.rank)])
                .where(and_(
                    Bucket.c.group_id == group_id,
                    Bucket.c.farm_id == self.farm_id)))
            maxrank = r.fetchone()[0]
            new_rank = rankBetween(maxrank, None)
            return self.update_bucket(bucket_id, {
                'rank': new_rank,
                'group_id': group_id,
            })


        return self.get_bucket(bucket_id)
            


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
        row = r.fetchone()
        if not row:
            raise NotFound()
        return dict(row)

    @policy.allow(anything)
    def update_bucket(self, id, data):
        updatable = [
            'name',
            'out_to_pasture',
            'kind',
            'deposit',
            'goal',
            'end_date',
            'rank',
            'group_id',
        ]
        values = {}
        for key in updatable:
            val = data.get(key)
            if val is not None:
                values[key] = val

        if 'group_id' in values:
            self.get_group(values['group_id'])

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

