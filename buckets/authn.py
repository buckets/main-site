import sqlalchemy
from sqlalchemy import select, and_, func

import six

from humancrypto import y2016
from humancrypto.error import PasswordMatchesWrongYear
from humancrypto.error import VerifyMismatchError

from datetime import timedelta

from buckets.error import NotFound, VerificationError, Forbidden, AccountLocked
from buckets.error import DuplicateRegistration
from buckets.schema import User, Farm, UserFarm, AuthToken
from buckets.authz import AuthPolicy, anything, nothing


class UserManagement(object):
    """
    This contains functions for user management
    """

    policy = AuthPolicy()

    def __init__(self, engine, mailer, signin_urlmaker):
        """
        @param signin_urlmaker: A function that will be called with
            one argument (a token) and which should return the url
            a user can visit to sign in.
        """
        self.engine = engine
        self.mailer = mailer
        self.signin_urlmaker = signin_urlmaker

    def userOnly(getter):
        def authorizer(self, auth_context, method, kwargs):
            return auth_context.get('user_id') == getter(kwargs)
        return authorizer

    def farmHandOnly(farm_id_getter):
        def authorizer(self, auth_context, method, kwargs):
            farm_id = farm_id_getter(kwargs)
            user_id = auth_context.get('user_id')
            r = self.engine.execute(select([UserFarm.c.farm_id])
                .where(and_(
                    UserFarm.c.farm_id == farm_id,
                    UserFarm.c.user_id == user_id,
                )))
            if r.fetchone():
                return True
            return False
        return authorizer

    @policy.allow(anything)
    def create_user(self, email, name):
        email = email.lower()
        try:
            r = self.engine.execute(User.insert()
                .values(email=email, name=name)
                .returning(User))
        except sqlalchemy.exc.IntegrityError:
            raise DuplicateRegistration()
        row = r.fetchone()
        return dict(row)

    @policy.allow(userOnly(lambda x:x['id']))
    def get_user(self, id):
        r = self.engine.execute(select([User])
            .where(User.c.id == id))
        row = r.fetchone()
        return dict(row)

    @policy.allow(anything)
    def send_signin_email(self, email):
        """
        Send a sign-in email to the given email address
        if a corresponding user exists.

        @param email: Email address to send to.

        @raise NotFound: If the no such email is known to our
            system.
        """
        r = self.engine.execute(select([User.c.id])
            .where(User.c.email == email))
        row = r.fetchone()
        if not row:
            return
        user_id = row[0]
        token = self.generate_signin_token(user_id)
        signin_url = self.signin_urlmaker(token)
        self.mailer.sendTemplate(
            template_name='login',
            to_email=email,
            data={
                'signin_url': signin_url,
            })

    def generate_signin_token(self, user_id, _lifespan=3600):
        """
        Generate a token that can be exchanged for a user_id.
        """
        token = y2016.random_urlsafe_token()
        expires = func.now() + timedelta(seconds=_lifespan)
        try:
            self.engine.execute(AuthToken.insert()
                    .values(
                        expires=expires,
                        user_id=user_id,
                        token=token))
        except sqlalchemy.exc.IntegrityError:
            raise NotFound()
        return token

    @policy.allow(anything)
    def user_id_from_signin_token(self, token, _now=func.now()):
        """
        Get the user_id associated with the given signin token.
        """
        with self.engine.begin() as conn:
            r = conn.execute(
                select([AuthToken.c.id, AuthToken.c.user_id])
                .where(and_(
                    AuthToken.c.token == token,
                    AuthToken.c.expires > _now,
                ))
                .with_for_update()
            )
            row = r.fetchone()
            if not row:
                raise NotFound()
            token_id, user_id = row
            conn.execute(AuthToken.delete()
                .where(AuthToken.c.id == token_id))
            return user_id

    @policy.allow(userOnly(lambda x:x['user_id']))
    def set_pin(self, user_id, pin):
        if self.has_pin(user_id):
            raise Forbidden('PIN already set')
        if isinstance(pin, six.text_type):
            pin = pin.encode()
        hashed = y2016.store_password(pin)
        self.engine.execute(User.update()
            .values(_pin=hashed)
            .where(User.c.id == user_id))

    @policy.allow(userOnly(lambda x:x['user_id']))
    def has_pin(self, user_id):
        r = self.engine.execute(select([User.c._pin])
            .where(User.c.id == user_id))
        if r.fetchone()[0]:
            return True
        else:
            return False

    @policy.allow(nothing)
    def reset_pin(self, user_id):
        self.engine.execute(User.update()
            .values(_pin=None)
            .where(User.c.id == user_id))

    @policy.allow(userOnly(lambda x:x['user_id']))
    def verify_pin(self, user_id, pin):
        if isinstance(pin, six.text_type):
            pin = pin.encode()
        r = self.engine.execute(select([
                User.c._pin,
                User.c._pin_failures,
            ])
            .where(User.c.id == user_id))
        _pin, _pin_failures = r.fetchone()
        if _pin_failures >= 5:
            raise AccountLocked()
        try:
            y2016.verify_password(_pin, pin)
            self.engine.execute(User.update()
                .values(_pin_failures=0)
                .where(User.c.id == user_id))
        except PasswordMatchesWrongYear:
            # re-hash it to improve security
            new_pin = y2016.store_password(pin)
            self.engine.execute(User.update()
                .values(_pin=new_pin)
                .where(User.c.id == user_id))
        except VerifyMismatchError:
            self.engine.execute(User.update()
                .values(_pin_failures=User.c._pin_failures+1)
                .where(User.c.id == user_id))
            raise VerificationError('Incorrect PIN')

    @policy.allow(userOnly(lambda x:x['creator_id']))
    def create_farm(self, creator_id, name='Family'):
        with self.engine.begin() as conn:
            r = conn.execute(Farm.insert()
                .values(name=name, creator_id=creator_id)
                .returning(Farm.c.id))
            row = r.fetchone()
            farm_id = row[0]
            conn.execute(UserFarm.insert()
                .values(farm_id=farm_id, user_id=creator_id))
        return self.get_farm(farm_id)

    def add_user_to_farm(self, farm_id, user_id):
        self.engine.execute(UserFarm.insert()
            .values(user_id=user_id, farm_id=farm_id))

    def remove_user_from_farm(self, farm_id, user_id):
        self.engine.execute(UserFarm.delete()
            .where(and_(
                UserFarm.c.user_id == user_id,
                UserFarm.c.farm_id == farm_id)))

    @policy.allow(farmHandOnly(lambda x:x['id']))
    def get_farm(self, id):
        r = self.engine.execute(
            select([Farm])
            .where(Farm.c.id == id))
        farm = dict(r.fetchone())
        r = self.engine.execute(
            select([User.c.id, User.c.name])
            .where(and_(
                User.c.id == UserFarm.c.user_id,
                UserFarm.c.farm_id == id)))
        farm['users'] = [dict(x) for x in r.fetchall()]
        return farm

    @policy.allow(userOnly(lambda x:x['user_id']))
    def list_farms(self, user_id):
        r = self.engine.execute(
            select([Farm.c.id])
            .where(and_(
                Farm.c.id == UserFarm.c.farm_id,
                UserFarm.c.user_id == user_id)))
        farm_ids = [x[0] for x in r.fetchall()]
        return [self.get_farm(x) for x in farm_ids]

    def is_paid_for(self, farm_id):
        return self.engine.execute(
            select([Farm.c.service_expiration >= func.now()])
            .where(Farm.c.id == farm_id)).fetchone()[0] == True

