
class AuthPolicy(object):

    def __init__(self):
        self._auth_functions = {}

    def __get__(self, obj, cls=None):
        return _BoundAuthPolicy(obj, self)

    def allow(self, *func):
        if len(func) == 1:
            func = func[0]
        else:
            func = allOf(*func)
        def deco(f):
            func_name = f.__name__
            self._auth_functions[func_name] = func
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
        auth_func = self._policy._auth_functions[func_name]
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

