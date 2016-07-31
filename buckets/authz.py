from collections import defaultdict


class AuthPolicy(object):

    def __init__(self):
        self._auth_functions = defaultdict(list)
        self._common_auth = []
        self._objects = defaultdict(dict)

    def __get__(self, obj, cls=None):
        return _BoundAuthPolicy(obj, self)

    def common(self, func):
        self._common_auth.append(func)
        return func

    def use_common(self, func):
        """
        Rely on the common authorization function.
        """
        if not self._common_auth:
            raise ValueError('A definition of common must precede'
                             ' use of @AuthPolicy.use_common')
        return self.allow(anything)(func)

    def allow(self, *func):
        def deco(f):
            func_name = f.__name__
            self._auth_functions[func_name].extend(func)
            return f
        return deco

    def obj(self, getter, obj_type):
        """
        @param getter: Either a string identifying the variable
            or else a function that will be called with the kwargs
            of the method call, from which a list of values should
            be returned.
        @param obj_type: Identifying object type -- can be a custom
            string or whatever you want.
        """
        arg_getter = getter
        if isinstance(getter, str):
            arg_getter = single_getter(getter)

        def deco(f):
            func_name = f.__name__
            self._objects[func_name][arg_getter] = obj_type
            return f
        return deco


class _BoundAuthPolicy(object):

    def __init__(self, instance, policy):
        """
        @param instance: The instance a policy is attached to
        @param policy: An AuthPolicy instance.
        """
        self._instance = instance
        self._policy = policy

    def __repr__(self):
        return '<_BoundAuthPolicy for {0!r}>'.format(self._instance)

    def call(self, auth_context, func_name, *args, **kwargs):
        self.authorize(auth_context, func_name, *args, **kwargs)
        method = getattr(self._instance, func_name)
        return method(*args, **kwargs)

    def authorize(self, auth_context, func_name, *args, **kwargs):
        if args:
            raise TypeError('Currently, positional arguments are not'
                            ' supported by AuthPolicy instances.')
        
        # no private kwargs
        for key in kwargs:
            if key.startswith('_'):
                raise NotAuthorized(self._instance, auth_context, func_name, kwargs)

        # common authorization
        for func in self._policy._common_auth:
            if not func(self._instance, auth_context, func_name, kwargs):
                raise NotAuthorized(self._instance, auth_context, func_name, kwargs)

        # specific authorization
        for auth_func in self._policy._auth_functions[func_name]:
            if not auth_func(self._instance, auth_context, func_name, kwargs):
                raise NotAuthorized(self._instance, auth_context, func_name, kwargs)

    def is_authorized(self, auth_context, func_name, *args, **kwargs):
        try:
            self.authorize(auth_context, func_name, *args, **kwargs)
            return True
        except NotAuthorized:
            return False

    def list_functions(self):
        """
        List known functions.
        """
        return self._policy._auth_functions.keys()

    def get_objects(self, method, **kwargs):
        ret = []
        for getter, obj_type in self._policy._objects[method].items():
            for value in getter(kwargs):
                ret.append((obj_type, value))
        return ret

    def bindContext(self, context):
        return _ContextBoundAuthPolicy(self, context)

    def bindAuthOnly(self, context):
        """
        Bind the given context to an impotent object that
        lets you call all functions on the wrapped instance,
        but which doesn't actually run the functions.

        Mostly used for testing.
        """
        return _ContextBoundAuthPolicy(self, context, run=False)


class _ContextBoundAuthPolicy(object):

    def __init__(self, bound_policy, context, run=True):
        """
        @param bound_policy: A _BoundAuthPolicy instance
        @param context: An authorization context.
        """
        self._bound_policy = bound_policy
        self._context = context
        self._run = run

    def __getattr__(self, name):
        if name in self._bound_policy._policy._auth_functions:
            if self._run:
                def _runit(*a, **kw):
                    return self._bound_policy.call(self._context, name, *a, **kw)
                return _runit
            else:
                return lambda *a,**kw: self._bound_policy.is_authorized(self._context, name, *a, **kw)
        else:
            # This traceback isn't very helpful
            raise AttributeError('{0} has no attribute {1}'.format(
                self._bound_policy, name))


class BindableMultiAuth(object):

    def __init__(self):
        self.policies = {}

    def registerPolicy(self, name, policy):
        self.policies[name] = policy

    def bindContext(self, context):
        return _BoundMultiAuth(self, context)


class _BoundMultiAuth(object):

    def __init__(self, parent, context):
        self._parent = parent
        self._context = context
        self._cache = {}

    def __getattr__(self, name):
        if name not in self._cache:
            if name in self._parent.policies:
                self._cache[name] = self._parent.policies[name].bindContext(self._context)
            else:
                raise AttributeError(
                    '{0} has no registered policy {1}'.format(
                    self._parent, name))
        return self._cache[name]


class NotAuthorized(Exception):
    pass


def anything(instance, context, func, kwargs):
    return True


def nothing(instance, context, func, kwargs):
    return False


def allOf(*funcs):
    def func(*args, **kwargs):
        for f in funcs:
            if not f(*args, **kwargs):
                return False
        return True
    return func


def anyOf(*funcs):
    def func(*args, **kwargs):
        for f in funcs:
            if f(*args, **kwargs):
                return True
        return False
    return func


def single_getter(key):
    """
    For use in an @obj decorator to get a single value from an argument.
    This is the getter used if a string is passed to @obj()
    """
    def func(kwargs):
        return [kwargs.get(key, None)]
    return func


def pluck(outerkey, innerkey):
    """
    For use in an @obj decorator to pluck elements from lists of dicts.
    """
    def func(kwargs):
        got = kwargs.get(outerkey, None) or []
        if isinstance(got, (list, tuple)):
            ret = [item.get(innerkey, None) for item in got]
        elif isinstance(got, dict):
            ret = [got.get(innerkey, None)]
        return ret
    return func

