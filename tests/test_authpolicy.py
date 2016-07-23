import pytest
from buckets.authn import UserManagement

@pytest.fixture
def user(engine):
    return UserManagement(engine)


class World(object):

    def __init__(self, policy, all_contexts):
        self.policy = policy
        self.all_contexts = all_contexts
        self.functions_covered = set()
        self.failures = []

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

class Expector(object):

    def __init__(self, world, method, args, kwargs):
        self.world = world
        self.method = method
        self.args = args
        self.kwargs = kwargs

    def format(self):
        args = [repr(x) for x in self.args]
        args += ['{0}={1!r}'.format(k,v) for k,v in self.kwargs.items()]
        return '{0}({1})'.format(self.method, ', '.join(args))

    def expect(self, *expected_allowed):
        errors = []
        for key in sorted(self.world.all_contexts):
            auth_context = self.world.all_contexts[key]
            is_authorized = self.world.policy.is_authorized(
                auth_context, self.method, *self.args, **self.kwargs)
            if is_authorized and key not in expected_allowed:
                errors.append('    {key!r} was allowed, but should not have been'.format(**locals()))
            if not(is_authorized) and key in expected_allowed:
                errors.append('    {key!r} was forbidden, but should have been allowed'.format(**locals()))
        if errors:
            self.world.failures.append('\n{0}:\n{1}'.format(
                self.format(),
                '\n'.join(errors)))
        self.world.functions_covered.add(self.method)


def test_UserManagement(user):
    bob = user.create_user('bob@bob.com', 'bob')
    sam = user.create_user('sam@sam.com', 'sam')

    bobs_farm = user.create_farm(creator_id=bob['id'])

    contexts = {
        'bob': {'user_id': bob['id']},
        'sam': {'user_id': sam['id']},
        'anon': {},
    }

    with World(user.policy, contexts) as world:
        world.forcall('create_user', email='a@a.com', name='a')\
            .expect('bob', 'sam', 'anon')
        world.forcall('get_user', id=bob['id'])\
            .expect('bob')
        world.forcall('create_farm', creator_id=bob['id'])\
            .expect('bob')
        world.forcall('get_farm', id=bobs_farm['id'])\
            .expect('bob')
        world.forcall('list_farms', user_id=bob['id'])\
            .expect('bob')
