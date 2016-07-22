class Error(Exception):pass

class UserDisplayableError(Error): pass

class NotFound(UserDisplayableError):pass
class AmountsDontMatch(UserDisplayableError):pass

