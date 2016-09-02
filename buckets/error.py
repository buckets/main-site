class Error(Exception):pass

class BadValue(Error):
    def __init__(self, name=None):
        self.name = name

class UserDisplayableError(Error): pass

class DuplicateRegistration(Error): pass
class AccountLocked(Error): pass

class Forbidden(UserDisplayableError): pass
class NotFound(UserDisplayableError): pass
class AmountsDontMatch(UserDisplayableError): pass
class VerificationError(UserDisplayableError): pass

