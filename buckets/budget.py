from hashlib import sha1
from datetime import date, datetime, timedelta
import time
from decimal import Decimal

import sqlalchemy
from sqlalchemy import select, and_, func
import requests

from buckets.schema import UserFarm
from buckets.schema import Bucket, BucketTrans, Group
from buckets.schema import Account, AccountTrans, Connection
from buckets.schema import AccountMapping
from buckets.authz import AuthPolicy, anything
from buckets.rank import rankBetween
from buckets.error import Error, NotFound, AmountsDontMatch


DEFAULT_SALT = '@\x95\xcd\xb0\xff\xa1\xe0\xdc\xfe^\x95g0\xa8\xe9+\x0bZ\xf1\xb3U\xb9\x03\xdeN\x97\xd1\x18\xbe)\x85\xde\xe4h\xe9?>\x9e\x12\x08]\xfb\xc5\x8a\x81\xddv\xa1cM\x8e\x06\xacAh\xba#\x14\x08\xbe\x1f\xec\x11\xf4\xb5)a\xaa\xb4\x1d\x9b\xa8M\xddZx\x05\\\xe0\xa3+\xf4,\xfd\xacYV\x93i\xe2\xb8H0*~\xc2X\x914\x96\x11\xc8\x82\xbd\xaa.0\xbd\x02XB\x07\xbe\xc5\xcb\xcf*\xe0\x1cg\xdd\x10\xbb\x16\xf6\x9d\x9bq'

def moneystrtoint(x):
    return int(Decimal(x).quantize(Decimal('0.01'))*100)

def hashStrings(strings, salt=DEFAULT_SALT):
    hashes = [sha1(x).digest() for x in strings] + [salt]
    return sha1(''.join(hashes)).hexdigest()



class BudgetManagement(object):
    """
    This contains functions for working a farm
    """

    policy = AuthPolicy()

    def __init__(self, engine, farm_id, _requests=requests):
        self.engine = engine
        self.farm_id = farm_id
        self.requests = _requests


    @policy.common
    def _only_people_in_farm(self, auth_context, method, kwargs):
        """
        Only people in the farm are allowed to call methods on this.
        """
        user_id = auth_context.get('user_id', None)
        if user_id is None:
            return False

        r = self.engine.execute(select([UserFarm.c.farm_id])
            .where(and_(
                UserFarm.c.farm_id == self.farm_id,
                UserFarm.c.user_id == user_id)))
        if r.fetchone():
            return True
        return False

    def bucket_in_farm(self, bucket_id):
        if bucket_id is None:
            return True
        r = self.engine.execute(select([Bucket.c.id])
            .where(and_(
                Bucket.c.id == bucket_id,
                Bucket.c.farm_id == self.farm_id,
            )))
        if r.fetchone():
            return True
        return False

    def group_in_farm(self, group_id):
        if group_id is None:
            return True
        r = self.engine.execute(select([Group.c.id])
            .where(and_(
                Group.c.id == group_id,
                Group.c.farm_id == self.farm_id,
            )))
        if r.fetchone():
            return True
        return False

    def trans_in_farm(self, trans_id):
        if trans_id is None:
            return True
        r = self.engine.execute(select([AccountTrans.c.id])
            .where(and_(
                AccountTrans.c.id == trans_id,
                AccountTrans.c.account_id == Account.c.id,
                Account.c.farm_id == self.farm_id,
            )))
        if r.fetchone():
            return True
        return False

    def inFarm(getter, checker):
        def verifier(self, auth_context, method, kwargs):
            value = getter(kwargs)
            return checker(self, value)
        return verifier

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
            raise NotFound("No such account")
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
            posted=None, fi_id=None):
        values = {
            'account_id': account_id,
            'amount': amount,
            'memo': memo,
        }
        if posted:
            values['posted'] = posted
        if fi_id:
            values['fi_id'] = fi_id
        r = self.engine.execute(AccountTrans.insert()
            .values(**values)
            .returning(AccountTrans.c.id))
        trans_id = r.fetchone()[0]
        return self.get_account_trans(trans_id)

    @policy.allow(anything)
    def list_account_trans(self):
        # get 100 days by default
        timeago = date.today() - timedelta(days=100)
        wheres = (AccountTrans.c.posted >= timeago,)
        return list(self._list_account_trans(wheres))

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
            raise NotFound("No such transaction")
        else:
            return trans[0]

    def _authorizeBuckets(self, auth_context, method, kwargs):
        for bucket in kwargs.get('buckets', []):
            if not self.bucket_in_farm(bucket['bucket_id']):
                return False
        return True

    @policy.allow(_authorizeBuckets)
    def categorize(self, trans_id, buckets):
        trans = self.get_account_trans(trans_id)
        self.engine.execute(BucketTrans.delete()
            .where(BucketTrans.c.account_transaction_id==trans_id))
        left = trans['amount']

        # make sure we don't invent money
        total = sum([abs(x.get('amount', 0)) for x in buckets])
        if total > abs(left):
            raise AmountsDontMatch("Category totals don't match transaction amount.")

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
            .values(cat_likely=True, skip_cat=False)
            .where(AccountTrans.c.id == trans_id))
        return self.get_account_trans(trans_id)

    @policy.allow(anything)
    def skip_categorizing(self, trans_id):
        self.get_account_trans(trans_id)
        self.engine.execute(BucketTrans.delete()
            .where(BucketTrans.c.account_transaction_id==trans_id))
        self.engine.execute(AccountTrans.update()
            .values(cat_likely=True, skip_cat=True)
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
            raise NotFound("No such group")
        return dict(row)

    @policy.allow(anything)
    def list_groups(self):
        r = self.engine.execute(
            select([Group])
            .where(Group.c.farm_id == self.farm_id)
            .order_by(Group.c.ranking))
        return [dict(x) for x in r.fetchall()]

    @policy.allow(inFarm(lambda x:x['group_id'], group_in_farm))
    @policy.allow(inFarm(lambda x:x['after_group'], group_in_farm))
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

    @policy.allow(inFarm(lambda x:x['bucket_id'], bucket_in_farm))
    @policy.allow(inFarm(lambda x:x.get('after_bucket'), bucket_in_farm))
    @policy.allow(inFarm(lambda x:x.get('group_id'), group_in_farm))
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
            raise NotFound("No such bucket")
        return dict(row)

    @policy.allow(inFarm(lambda x:x['data'].get('group_id'), group_in_farm))
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

    @policy.allow(inFarm(lambda x:x['bucket_id'], bucket_in_farm))
    @policy.allow(inFarm(lambda x:x.get('_account_transaction_id'), trans_in_farm))
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

    #----------------------------------------------------------
    # SimpleFIN

    @policy.allow(anything)
    def simplefin_claim(self, token):
        """
        Claim a simplefin token
        """
        r = self.requests.post(token.decode('base64'))
        access_token = r.text
        r = self.engine.execute(Connection.insert()
            .values(farm_id=self.farm_id, access_token=access_token)
            .returning(Connection))
        return dict(r.fetchone())

    @policy.allow(anything)
    def add_account_hash(self, account_id, account_hash):
        """
        Associate an account with a hash (as returned by simplefin_fetch)
        """
        self.engine.execute(AccountMapping.insert()
            .values(
                farm_id=self.farm_id,
                account_id=account_id,
                account_hash=account_hash))
        return None

    @policy.allow(anything)
    def simplefin_list_connections(self):
        r = self.engine.execute(select([Connection])
            .where(Connection.c.farm_id == self.farm_id)
            .order_by(Connection.c.id))
        return [dict(x) for x in r.fetchall()]

    @policy.allow(anything)
    def simplefin_fetch(self):
        """
        Fetch account+transaction data for all simplefin tokens
        associated with this farm.
        """
        days = 45
        r = self.engine.execute(select([Connection])
            .where(Connection.c.farm_id == self.farm_id)
            .order_by(Connection.c.id))
        conns = [dict(x) for x in r.fetchall()]

        ret = {
            'unknown_accounts': [],
            'accounts': [],
            'errors': [],
        }
        start_date = long(time.time() - 60 * 60 * 24 * days)
        sfin_accounts = []
        for conn in conns:
            access_token = conn['access_token']
            scheme, rest = access_token.split('//', 1)
            auth, rest = rest.split('@', 1)
            url = scheme + '//' + rest + '/accounts'
            username, password = auth.split(':', 1)

            response = self.requests.get(
                url,
                params={'start-date': start_date},
                auth=(username, password))
            data = response.json()
            for user_error in data.get('errors', []):
                if user_error not in ret['errors']:
                    ret['errors'].append(user_error)
            for account in data.get('accounts', []):
                sfin_accounts.append(account)

            self.engine.execute(Connection.update()
                .values(last_used=func.now())
                .where(Connection.c.id == conn['id']))

        for account in sfin_accounts:
            org = account['org'].get('name', account['org']['domain'])
            sfin_account_id = account['id']
            h = hashStrings([org, sfin_account_id])
            result = self.engine.execute(
                select([AccountMapping.c.account_id])
                .where(and_(
                    AccountMapping.c.farm_id == self.farm_id,
                    AccountMapping.c.account_hash == h,
                )))
            first = result.fetchone()
            if first:
                # found a match
                account_id = first[0]
                this_ret = {
                    'id': account_id,
                    'transactions': [],
                }
                ret['accounts'].append(this_ret)
                transactions = []
                for trans in account['transactions']:
                    transactions.append(self.account_transact(
                        account_id=account_id,
                        memo=trans['description'],
                        amount=moneystrtoint(trans['amount']),
                        posted=datetime.fromtimestamp(trans['posted']),
                        fi_id=trans['id']))
                this_ret['transactions'] = transactions

                # update account balance
                self.update_account(account_id, {
                    'balance': moneystrtoint(account['balance']),
                })
            else:
                # no match
                ret['unknown_accounts'].append({
                    'id': sfin_account_id,
                    'name': account['name'],
                    'organization': org,
                    'hash': h,
                })
        return ret

