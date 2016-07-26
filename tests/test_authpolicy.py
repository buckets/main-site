from buckets.authn import UserManagement
from buckets.budget import BudgetManagement

import uuid

def random(prefix='', suffix=''):
    return '{0}{1}{2}'.format(prefix, uuid.uuid4(), suffix)


class World(object):

    def __init__(self, policy, all_contexts, variables=None):
        self.policy = policy
        self.all_contexts = all_contexts
        self.functions_covered = set()
        self.failures = []
        self.variables = variables or {}

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.finish()

    def forcall(self, method, *args, **kwargs):
        return Expector(self, method, args, kwargs)

    def finish(self):
        missing = set(self.policy.list_functions()) - set(self.functions_covered)
        if missing:
            self.failures.append('\nThe following functions were not covered:\n{0}'.format(
                '\n'.join([repr(x) for x in missing])))

        if self.failures:
            raise Exception('\n'.join(self.failures))

    def replaceVars(self, obj):
        if isinstance(obj, Var):
            return self.variables[obj.name]
        elif isinstance(obj, (list, tuple)):
            return [self.replaceVars(x) for x in obj]
        elif isinstance(obj, dict):
            return {self.replaceVars(k):self.replaceVars(v) for k,v in obj.items()}
        else:
            return obj


class Var(object):

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '{0}'.format(self.name)


class Expector(object):

    def __init__(self, world, method, args, kwargs):
        self.world = world
        self.method = method
        self.args = args
        self.kwargs = kwargs

        self.real_args = world.replaceVars(args)
        self.real_kwargs = world.replaceVars(kwargs)

    def format(self):
        args = [repr(x) for x in self.args]
        args += ['{0}={1!r}'.format(k,v) for k,v in self.kwargs.items()]
        # real_args = [repr(x) for x in self.real_args]
        # real_args += ['{0}={1!r}'.format(k,v) for k,v in self.real_kwargs.items()]
        return '{0}({1})'.format(self.method, ', '.join(args))

    def expect(self, *expected_allowed):
        errors = []
        for key in sorted(self.world.all_contexts):
            auth_context = self.world.all_contexts[key]
            is_authorized = self.world.policy.is_authorized(
                auth_context, self.method, *self.real_args, **self.real_kwargs)
            if is_authorized and key not in expected_allowed:
                errors.append('    {key!r} was allowed, but should not have been'.format(**locals()))
            if not(is_authorized) and key in expected_allowed:
                errors.append('    {key!r} was forbidden, but should have been allowed'.format(**locals()))
        if errors:
            self.world.failures.append('\n{0}:\n{1}'.format(
                self.format(),
                '\n'.join(errors)))
        self.world.functions_covered.add(self.method)


def test_UserManagement(engine):
    api = UserManagement(engine)
    bob = api.create_user(random('bob', '@bob.com'), 'bob')
    sam = api.create_user(random('sam', '@sam.com'), 'sam')

    bobs_farm = api.create_farm(creator_id=bob['id'])

    contexts = {
        'bob': {'user_id': bob['id']},
        'sam': {'user_id': sam['id']},
        'anon': {},
    }

    with World(api.policy, contexts) as world:
        world.forcall(
            'create_user', email='a@a.com', name='a'
        ).expect('bob', 'sam', 'anon')
        world.forcall(
            'get_user', id=bob['id']
        ).expect('bob')
        world.forcall(
            'create_farm', creator_id=bob['id']
        ).expect('bob')
        world.forcall(
            'get_farm', id=bobs_farm['id']
        ).expect('bob')
        world.forcall(
            'list_farms', user_id=bob['id']
        ).expect('bob')

def test_BudgetManagement(engine):
    user = UserManagement(engine)
    bob = user.create_user(random('bob', '@bob.com'), 'bob')
    sam = user.create_user(random('sam', '@sam.com'), 'sam')
    bobs_farm = user.create_farm(creator_id=bob['id'])
    sams_farm = user.create_farm(creator_id=sam['id'])


    api = BudgetManagement(engine, bobs_farm['id'])
    bobs_account = api.create_account('Checking')
    bobs_trans = api.account_transact(bobs_account['id'], 100)
    bobs_bucket = api.create_bucket('Bucket')
    bobs_group = api.create_group('Group')

    sam_api = BudgetManagement(engine, sams_farm['id'])
    sams_bucket = sam_api.create_bucket('Sam Bucket')
    sams_group = sam_api.create_group('Sam Group')
    sams_account = sam_api.create_account('Sam Checking')
    sams_trans = sam_api.account_transact(sams_account['id'], 100)

    contexts = {
        'bob': {'user_id': bob['id']},
        'sam': {'user_id': sam['id']},
        'anon': {},
    }

    variables = {
        'bobs_account': bobs_account['id'],
        'bobs_trans': bobs_trans['id'],
        'bobs_bucket': bobs_bucket['id'],
        'bobs_group': bobs_group['id'],

        'sams_account': sams_account['id'],
        'sams_trans': sams_trans['id'],
        'sams_bucket': sams_bucket['id'],
        'sams_group': sams_group['id'],
    }

    bobs_account = Var('bobs_account')
    bobs_trans = Var('bobs_trans')
    bobs_bucket = Var('bobs_bucket')
    bobs_group = Var('bobs_group')
    sams_account = Var('sams_account')
    sams_trans = Var('sams_trans')
    sams_bucket = Var('sams_bucket')
    sams_group = Var('sams_group')

    with World(api.policy, contexts, variables) as world:
        world.forcall(
            'create_account', name='something'
        ).expect('bob')
        
        world.forcall(
            'get_account', id=bobs_account
        ).expect('bob')
        world.forcall(
            'get_account', id=sams_account
        ).expect()

        world.forcall(
            'update_account', id=bobs_account, data={'name': 'hey'}
        ).expect('bob')
        world.forcall(
            'update_account', id=sams_account, data={}
        ).expect()

        world.forcall('list_accounts').expect('bob')
        world.forcall('has_accounts').expect('bob')
        world.forcall('has_transactions').expect('bob')
        
        world.forcall(
            'account_transact', account_id=bobs_account, amount=10
        ).expect('bob')
        world.forcall(
            'account_transact', account_id=sams_account, amount=10
        ).expect()

        world.forcall('delete_account_trans', id=bobs_trans
            ).expect('bob')
        world.forcall('delete_account_trans', id=sams_trans
            ).expect()

        world.forcall('list_account_trans').expect('bob')
        
        world.forcall(
            'get_account_trans', id=bobs_trans
        ).expect('bob')
        world.forcall(
            'get_account_trans', id=sams_trans
        ).expect()
        
        world.forcall(
            'categorize', trans_id=bobs_trans, buckets=[
                {'bucket_id': bobs_bucket},
            ]
        ).expect('bob')
        world.forcall(
            'categorize', trans_id=sams_trans, buckets=[
                {'bucket_id': bobs_bucket},
            ]
        ).expect()
        world.forcall(
            'categorize', trans_id=bobs_trans, buckets=[
                {'bucket_id': sams_bucket},
            ]
        ).expect()
        
        world.forcall(
            'skip_categorizing', trans_id=bobs_trans
        ).expect('bob')
        world.forcall(
            'create_group', name='a'
        ).expect('bob')
        world.forcall(
            'update_group', id=bobs_group, data={}
        ).expect('bob')
        world.forcall(
            'get_group', id=bobs_group
        ).expect('bob')
        world.forcall('list_groups').expect('bob')

        world.forcall(
            'move_group', group_id=bobs_group, after_group=bobs_group
        ).expect('bob')
        world.forcall(
            'move_group', group_id=sams_group, after_group=bobs_group
        ).expect()
        world.forcall(
            'move_group', group_id=bobs_group, after_group=sams_group
        ).expect()
        
        world.forcall(
            'move_bucket',
            bucket_id=bobs_bucket,
            after_bucket=bobs_bucket
        ).expect('bob')
        world.forcall(
            'move_bucket',
            bucket_id=bobs_bucket,
            after_bucket=sams_bucket
        ).expect()
        world.forcall(
            'move_bucket',
            bucket_id=sams_bucket,
            after_bucket=bobs_bucket
        ).expect()

        world.forcall(
            'move_bucket',
            bucket_id=bobs_bucket,
            group_id=bobs_group
        ).expect('bob')
        world.forcall(
            'move_bucket',
            bucket_id=bobs_bucket,
            group_id=sams_group
        ).expect()
        world.forcall(
            'move_bucket',
            bucket_id=sams_bucket,
            group_id=bobs_group
        ).expect()

        world.forcall(
            'create_bucket', name='a').expect('bob')
        world.forcall(
            'has_buckets').expect('bob')
        world.forcall(
            'get_bucket', id=bobs_bucket).expect('bob')
        
        world.forcall(
            'update_bucket', id=bobs_bucket, data={}).expect('bob')
        world.forcall(
            'update_bucket', id=bobs_bucket,
            data={'group_id': bobs_group}).expect('bob')
        world.forcall(
            'update_bucket', id=bobs_bucket,
            data={'group_id': sams_group}).expect()

        world.forcall(
            'list_buckets').expect('bob')
        world.forcall(
            'bucket_transact', bucket_id=bobs_bucket, amount=10
            ).expect('bob')

        world.forcall('list_bucket_trans', bucket_id=bobs_bucket
        ).expect('bob')
        world.forcall('list_bucket_trans', bucket_id=sams_bucket
        ).expect()

        world.forcall(
            'bucket_transact',
            bucket_id=bobs_bucket,
            amount=10,
            _account_transaction_id=bobs_trans
            ).expect('bob')
        world.forcall(
            'bucket_transact',
            bucket_id=sams_bucket,
            amount=10,
            _account_transaction_id=bobs_trans
            ).expect()

        world.forcall(
            'has_connections').expect('bob')
        world.forcall(
            'simplefin_claim', token='foo').expect('bob')
        world.forcall(
            'add_account_hash', account_id=bobs_account
            ).expect('bob')
        world.forcall(
            'simplefin_list_connections').expect('bob')
        world.forcall(
            'simplefin_fetch').expect('bob')
