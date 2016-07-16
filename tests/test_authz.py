import pytest

from buckets.authz import AuthPolicy, anything, nothing, NotAuthorized
from buckets.authz import BindableMultiAuth


class TestAuthPolicyTest(object):


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


def test_basic():
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
