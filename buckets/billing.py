from sqlalchemy import select, and_

from buckets.error import NotFound
from buckets.schema import User, Farm, UserFarm
from buckets.authz import AuthPolicy, anything, nothing


class BillingManagement(object):

    policy = AuthPolicy()

    def __init__(self, engine, stripe):
        self.engine = engine
        self.stripe = stripe

    def has_current_payment_method(self, user_id):
        cu = self.stripe_customer(user_id)
        if not cu.default_source:
            return False

        source = cu.getSource()
        print 'source', source

    def stripe_customer(self, user_id):
        """
        Get the associated Stripe customer of a user.
        """
        r = self.engine.execute(
            select([User.c._stripe_customer_id])
            .where(User.c.id == user_id))
        p_user = r.fetchone()
        if p_user._stripe_customer_id:
            cu = self.stripe.Customer.retrieve(
                p_user._stripe_customer_id)
            if cu.default_source:
                cu.getSource = lambda: [x for x in cu.sources['data'] if x['id'] == cu.default_source][0]
            else:
                cu.getSource = lambda: None
            return cu
        else:
            # no associated stripe customer
            raise NotFound()

    def set_credit_card(self, user_id, token):
        r = self.engine.execute(
            select([
                User.c._stripe_customer_id,
                User.c.email,])
            .where(User.c.id == user_id))
        p_user = r.fetchone()
        if not p_user._stripe_customer_id:
            # create
            cu = self.stripe.Customer.create(
                email=p_user.email)
            self.engine.execute(
                User
                .update()
                .values(_stripe_customer_id=cu.id)
                .where(User.c.id == user_id))
        else:
            # update
            cu = self.stripe.Customer.retrieve(p_user._stripe_customer_id)
            cu.source = token
            cu.save()

