class Error(Exception):pass

class UserDisplayableError(Error): pass

class DuplicateRegistration(Error): pass
class AccountLocked(Error): pass

class Forbidden(UserDisplayableError): pass
class NotFound(UserDisplayableError): pass
class AmountsDontMatch(UserDisplayableError): pass
class VerificationError(UserDisplayableError): pass

