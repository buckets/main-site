import pytest

from buckets.authz import AuthPolicy, anything, nothing, NotAuthorized
from buckets.authz import BindableMultiAuth
from buckets.authz import pluck


class TestAuthPolicyTest(object):

    def test_common(self):
        """
        You can specify a common policy for functions
        """
        class Foo(object):
            auth = AuthPolicy()
            @auth.common
            def lessthan4(self, context, func, *args, **kwargs):
                return context['value'] < 4
            @auth.allow(anything)
            def exclaim(self, arg):
                return arg + '!'

        foo = Foo()
        auth = foo.auth
        result = auth.call({'value': 2}, 'exclaim', arg='hey')
        assert result == 'hey!'
        with pytest.raises(NotAuthorized):
            auth.call({'value': 5}, 'exclaim', arg='hey')

    def test_use_common(self):
        """
        You can rely on common
        """
        class Foo(object):
            auth = AuthPolicy()
            @auth.common
            def lessthan4(self, context, func, *args, **kwargs):
                return context['value'] < 4
            @auth.use_common
            def exclaim(self, arg):
                return arg + '!'

        foo = Foo()
        auth = foo.auth
        result = auth.call({'value': 2}, 'exclaim', arg='hey')
        assert result == 'hey!'
        with pytest.raises(NotAuthorized):
            auth.call({'value': 5}, 'exclaim', arg='hey')

    def test_use_common_no_common(self):
        """
        Relying on common when it's not defined is a problem.
        """
        with pytest.raises(ValueError):
            class Foo(object):
                auth = AuthPolicy()
                @auth.use_common
                def exclaim(self, arg):
                    return arg + '!'

    def test_anything(self):
        """
        You can allow anything as a policy
        """
        class Foo(object):
            auth = AuthPolicy()
            @auth.allow(anything)
            def exclaim(self, arg):
                return arg + '!'

        foo = Foo()
        auth = foo.auth
        result = auth.call({}, 'exclaim', arg='something')
        assert result == 'something!'
        auth.authorize({}, 'exclaim', arg='something')
        assert True is auth.is_authorized({}, 'exclaim', arg='something')
        assert auth.bindContext({}).exclaim(arg='something') == 'something!'
        assert True is auth.bindAuthOnly({}).exclaim(arg='something')


    def test_private_vars_not_allowed(self):
        class Foo(object):
            auth = AuthPolicy()
            @auth.allow(anything)
            def exlaim(self, arg, _symbol='!'):
                return arg + _symbol

        foo = Foo()
        auth = foo.auth
        assert False is auth.is_authorized({}, 'exclaim',
            arg='a', _symbol='something')

    def test_nothing(self):
        """
        You can forbid everything as a policy.
        """
        class Foo(object):
            auth = AuthPolicy()
            @auth.allow(nothing)
            def exclaim(self, arg):
                return arg + '!'

        foo = Foo()
        auth = foo.auth
        with pytest.raises(NotAuthorized):
            auth.call({}, 'exclaim', arg='something')
        with pytest.raises(NotAuthorized):
            auth.authorize({}, 'exclaim', arg='something')
        assert False is auth.is_authorized(
            {}, 'exclaim', arg='something')
        with pytest.raises(NotAuthorized):
            auth.bindContext({}).exclaim(arg='something')
        assert False is auth.bindAuthOnly({}).exclaim(arg='something')


    def test_instanceDefined(self):
        """
        You can use methods on the instance as authorizing
        functions.
        """
        class Foo(object):
            auth = AuthPolicy()

            def if_bob(self, context, *args, **kwargs):
                return context == 'bob'
            
            @auth.allow(if_bob)
            def exclaim(self, arg):
                return arg + '!'

        foo = Foo()
        auth = foo.auth
        with pytest.raises(NotAuthorized):
            auth.call('jim', 'exclaim', arg='something')

        assert auth.call('bob', 'exclaim', arg='something') == 'something!'

        bob = auth.bindContext('bob')
        assert bob.exclaim(arg='foo') == 'foo!'
        assert True is auth.bindAuthOnly('bob').exclaim(args='foo')
        sam = auth.bindContext('sam')
        with pytest.raises(NotAuthorized):
            sam.exclaim(arg='foo')
        assert False is auth.bindAuthOnly('sam').exclaim(args='foo')

    def test_raiseNotAuthorized(self):
        class Foo(object):
            auth = AuthPolicy()

            def if_bob(self, context, *args, **kwargs):
                raise NotAuthorized('hello')
            
            @auth.allow(if_bob)
            def exclaim(self, arg):
                return arg + '!'

        foo = Foo()
        auth = foo.auth
        with pytest.raises(NotAuthorized):
            auth.call('jim', 'exclaim', arg='something')

        bob = auth.bindContext('bob')
        with pytest.raises(NotAuthorized):
            bob.exclaim(arg='foo')
        
        assert False is auth.bindAuthOnly('bob').exclaim(args='foo')
        sam = auth.bindContext('sam')
        with pytest.raises(NotAuthorized):
            sam.exclaim(arg='foo')
        assert False is auth.bindAuthOnly('sam').exclaim(args='foo')        
        assert False is auth.is_authorized({}, 'exclaim', args='foo')

    def test_stackable(self):
        """
        You can have multiple allows.
        """
        class Foo(object):
            auth = AuthPolicy()

            def if_b(self, context, *args, **kwargs):
                return context.startswith('b')
            def if_long(self, context, *args, **kwargs):
                return len(context) >= 3
            
            @auth.allow(if_b)
            @auth.allow(if_long)
            def exclaim(self, arg):
                return arg + '!'

        foo = Foo()
        auth = foo.auth

        with pytest.raises(NotAuthorized):
            auth.call('jim', 'exclaim', arg='something')
        with pytest.raises(NotAuthorized):
            auth.call('bo', 'exclaim', arg='something')
        assert auth.call('bob', 'exclaim', arg='something') == 'something!'

    def test_and(self):
        """
        You can join multiple functions together.
        """
        class Foo(object):
            auth = AuthPolicy()

            def if_b(self, context, *args, **kwargs):
                return context.startswith('b')
            def if_long(self, context, *args, **kwargs):
                return len(context) >= 3
            
            @auth.allow(if_b, if_long)
            def exclaim(self, arg):
                return arg + '!'

        foo = Foo()
        auth = foo.auth

        with pytest.raises(NotAuthorized):
            auth.call('jim', 'exclaim', arg='something')
        with pytest.raises(NotAuthorized):
            auth.call('bo', 'exclaim', arg='something')
        assert auth.call('bob', 'exclaim', arg='something') == 'something!'

    def test_obj(self):
        """
        You can mark arguments as object types
        """
        class Foo(object):
            policy = AuthPolicy()

            @policy.obj('id', 'person')
            def find_person(self, id):
                return 'found {0}'.format(id)

        foo = Foo()
        objects = foo.policy.get_objects('find_person', id='samwise')
        assert objects == [('person', 'samwise')]

    def test_obj_multiple(self):
        class Foo(object):
            policy = AuthPolicy()

            @policy.obj('id', 'person')
            @policy.obj('friend', 'friend')
            def make_friend(self, id, friend):
                pass

        foo = Foo()
        objects = foo.policy.get_objects('make_friend',
            id='bob',
            friend='alice')
        assert set(objects) == set([
            ('person', 'bob'),
            ('friend', 'alice'),
        ])

    def test_obj_func(self):
        class Foo(object):
            policy = AuthPolicy()

            @policy.obj(lambda kw:[x['friend_id'] for x in kw.get('friends', [])],
                'friend')
            def make_friends(self, friends):
                pass

        foo = Foo()
        objects = foo.policy.get_objects('make_friends',
            friends=[{'friend_id': 10}, {'friend_id': 11}])
        assert objects == [('friend', 10), ('friend', 11)]

    def test_obj_pluck(self):
        class Foo(object):
            policy = AuthPolicy()

            @policy.obj(pluck('friends', 'friend_id'), 'friend')
            def make_friends(self, friends):
                pass

        foo = Foo()
        objects = foo.policy.get_objects('make_friends',
            friends=[{'friend_id': 10}, {'friend_id': 11}])
        assert objects == [('friend', 10), ('friend', 11)]        
        objects = foo.policy.get_objects('make_friends',
            friends=None)
        assert objects == []
        objects = foo.policy.get_objects('make_friends',
            friends={'friend_id': 10})
        assert objects == [('friend', 10)]



class Foo(object):

    policy = AuthPolicy()

    @policy.allow(anything)
    def action1(self):
        return 'foo action1'

    @policy.allow(nothing)
    def action2(self):
        return 'foo action2'


class Bar(object):

    policy = AuthPolicy()

    @policy.allow(anything)
    def action1(self):
        return 'bar action1'

    @policy.allow(nothing)
    def action2(self):
        return 'bar action2'


def test_multiauth():
    thing = BindableMultiAuth()
    thing.registerPolicy('foo', Foo().policy)
    thing.registerPolicy('bar', Bar().policy)

    ctx = {'hello': 'guys'}
    bound = thing.bindContext(ctx)
    assert bound.foo.action1() == 'foo action1'
    assert bound.bar.action1() == 'bar action1'
    with pytest.raises(NotAuthorized):
        bound.foo.action2()
    with pytest.raises(NotAuthorized):
        bound.bar.action2()

    assert bound.foo is bound.foo, "Should reuse instance"
