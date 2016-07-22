import sqlalchemy
from sqlalchemy import select, and_, func

from buckets.schema import Bucket, BucketTrans, Group
from buckets.schema import Account, AccountTrans
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

    @policy.allow(anything)
    def account_transact(self, account_id, amount, memo=None,
            posted=None):
        values = {
            'account_id': account_id,
            'amount': amount,
            'memo': memo,
        }
        if posted:
            values['posted'] = posted
        r = self.engine.execute(AccountTrans.insert()
            .values(**values)
            .returning(AccountTrans.c.id))
        trans_id = r.fetchone()[0]
        return self.get_account_trans(trans_id)

    @policy.allow(anything)
    def list_account_trans(self):
        return list(self._list_account_trans())

    def _list_account_trans(self, wheres=None):
        wheres = wheres or ()
        r = self.engine.execute(select([
                AccountTrans,
                func.array_agg(
                    func.json_build_object(
                        'bucket_id', BucketTrans.c.bucket_id,
                        'amount', BucketTrans.c.amount
                    )
                ).label('buckets'),
            ]).select_from(
                AccountTrans.outerjoin(
                    BucketTrans,
                    BucketTrans.c.account_transaction_id == AccountTrans.c.id)
            )
            .where(and_(
                AccountTrans.c.account_id == Account.c.id,
                Account.c.farm_id == self.farm_id,
                *wheres
            ))
            .group_by(AccountTrans.c.id)
            .order_by(AccountTrans.c.posted))
        for row in r.fetchall():
            trans = dict(row)
            trans['buckets'] = [x for x in trans['buckets'] if x['bucket_id']]    
            yield trans

    @policy.allow(anything)
    def get_account_trans(self, id):
        trans = list(self._list_account_trans((AccountTrans.c.id == id,)))
        if not trans:
            raise NotFound()
        else:
            return trans[0]

    @policy.allow(anything)
    def categorize(self, trans_id, buckets):
        trans = self.get_account_trans(trans_id)
        self.engine.execute(BucketTrans.delete()
            .where(BucketTrans.c.account_transaction_id==trans_id))
        left = trans['amount']
        sign = 1
        if trans['amount'] < 0:
            sign = -1
        for bucket in buckets:
            if bucket.get('amount', None) is None:
                bucket['amount'] = left
            left -= abs(bucket['amount']) * sign
            if bucket['amount']:
                self.bucket_transact(bucket['bucket_id'],
                    amount=abs(bucket['amount']) * sign,
                    posted=trans['posted'],
                    _account_transaction_id=trans_id)
        self.engine.execute(AccountTrans.update()
            .values(cat_likely=True)
            .where(AccountTrans.c.id == trans_id))
        return self.get_account_trans(trans_id)


    #----------------------------------------------------------
    # Group

    @policy.allow(anything)
    def create_group(self, name):
        r = self.engine.execute(select([
            func.max(Group.c.ranking)])
            .where(Group.c.farm_id == self.farm_id))
        maxrank = r.fetchone()[0] or 'a'
        thisrank = rankBetween(maxrank, None)
        r = self.engine.execute(Group.insert()
            .values(
                farm_id=self.farm_id,
                ranking=thisrank,
                name=name)
            .returning(Group))
        return dict(r.fetchone())

    @policy.allow(anything)
    def update_group(self, id, data):
        updatable = [
            'name',
            'ranking',
        ]
        values = {}
        for key in updatable:
            val = data.get(key)
            if val is not None:
                values[key] = val

        try:
            self.engine.execute(Group.update()
                .values(**values)
                .where(and_(
                    Group.c.id == id,
                    Group.c.farm_id == self.farm_id
                )))
        except sqlalchemy.exc.IntegrityError:
            raise Error("Duplicate ranking")
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
            .order_by(Group.c.ranking))
        return [dict(x) for x in r.fetchall()]

    @policy.allow(anything)
    def move_group(self, group_id, after_group):
        self.get_group(group_id)
        after = self.get_group(after_group)
        rank_start = after['ranking']
        rank_end = None

        r = self.engine.execute(select([
            Group.c.ranking])
            .where(and_(
                Group.c.farm_id == self.farm_id,
                Group.c.ranking > after['ranking'],
            ))
            .order_by(Group.c.ranking)
            .limit(1))
        row = r.fetchone()
        if row:
            rank_end = row[0]

        new_rank = rankBetween(rank_start, rank_end)
        return self.update_group(group_id, {
            'ranking': new_rank,
        })


    @policy.allow(anything)
    def move_bucket(self, bucket_id, after_bucket=None, group_id=None):
        if group_id and after_bucket:
            raise Error("Either supply after_bucket or group_id; not both")

        self.get_bucket(bucket_id)

        if after_bucket:
            # move after bucket
            after = self.get_bucket(after_bucket)
            rank_start = after['ranking']
            rank_end = None

            r = self.engine.execute(select([
                Bucket.c.ranking])
                .where(and_(
                    Bucket.c.group_id == after['group_id'],
                    Bucket.c.farm_id == self.farm_id,
                    Bucket.c.ranking > after['ranking'],
                ))
                .order_by(Bucket.c.ranking)
                .limit(1))
            row = r.fetchone()
            if row:
                rank_end = row[0]

            new_rank = rankBetween(rank_start, rank_end)
            return self.update_bucket(bucket_id, {
                'ranking': new_rank,
                'group_id': after['group_id'],
            })

        elif group_id:
            # move to beginning of group
            self.get_group(group_id)

            r = self.engine.execute(select([func.min(Bucket.c.ranking)])
                .where(and_(
                    Bucket.c.group_id == group_id,
                    Bucket.c.farm_id == self.farm_id)))
            minrank = r.fetchone()[0]
            new_rank = rankBetween(None, minrank)
            return self.update_bucket(bucket_id, {
                'ranking': new_rank,
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
            'ranking',
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
    def bucket_transact(self, bucket_id, amount, memo='', posted=None,
            _account_transaction_id=None):
        values = {
            'bucket_id': bucket_id,
            'amount': amount,
            'memo': memo,
            'account_transaction_id': _account_transaction_id,
        }
        if posted:
            values['posted'] = posted
        r = self.engine.execute(BucketTrans.insert()
            .values(**values)
            .returning(BucketTrans))
        return dict(r.fetchone())

