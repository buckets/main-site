from __future__ import print_function
from sqlalchemy import select, and_

import time
from datetime import date, timedelta, datetime

from buckets.error import NotFound
from buckets.schema import User, Farm, UserFarm
from buckets.authz import AuthPolicy, anything

import structlog
logger = structlog.get_logger()

ONEDAY = ONEDAY = ONEDAAAAAAAY = 24 * 3600

def date2unix(d):
    return long(time.mktime(d.timetuple()))

def unix2date(ts):
    return datetime.fromtimestamp(float(ts))



class BillingManagement(object):

    policy = AuthPolicy()

    PLANS = {
        'monthly': {
            'id': 'buckets-monthly-v2',
            'amount': 202,
            'name': 'Buckets Monthly',
            'interval': 'month',
            'interval_count': 1,
            'currency': 'usd',
        },
        'yearly': {
            'id': 'buckets-yearly-v2',
            'amount': 1064,
            'name': 'Buckets Yearly',
            'interval': 'year',
            'interval_count': 1,
            'currency': 'usd',
        },
    }


    def __init__(self, engine, stripe):
        self.engine = engine
        self.stripe = stripe
        stripe.api_version = '2016-07-06'

    def sync_plans_with_stripe(self):
        """
        Make sure Stripe has the plans you expect them to have.
        """
        for plan in self.PLANS.values():
            p = None
            try:
                p = self.stripe.Plan.retrieve(plan['id'])
            except self.stripe.error.InvalidRequestError:
                # create a new one
                self.stripe.Plan.create(**plan)
                continue
            p.name = plan['name']
            p.save()

    @policy.allow(anything)
    def current_payment_method(self, user_id):
        cu = self.stripe_customer(user_id)
        if not cu:
            return None
        source = cu.default_source
        if not source:
            return None
        exp = (date(source.exp_year, source.exp_month, 1)
                + timedelta(days=33)).replace(day=1)
        if date.today() > exp:
            return None
        return source

    def stripe_customer(self, user_id):
        """
        Get the Stripe customer associated with a user.
        """
        r = self.engine.execute(
            select([User.c._stripe_customer_id])
            .where(User.c.id == user_id))
        p_user = r.fetchone()
        if p_user._stripe_customer_id:
            cu = self.stripe.Customer.retrieve(
                p_user._stripe_customer_id,
                expand=['default_source'])
            return cu
        else:
            # no associated stripe customer
            return None

    @policy.allow(anything)
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
                email=p_user.email,
                source=token)
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

    @policy.allow(anything)
    def set_subscription(self, user_id, farm_id, plan):
        """
        Start paying for a farm or change the plan terms.
        """
        farm = self.engine.execute(
            select([
                Farm.c._stripe_sub_id,
                Farm.c.payer_id,
            ])
            .where(Farm.c.id == farm_id)).fetchone()
        has_access = self.engine.execute(select([UserFarm.c.user_id])
            .where(and_(
                UserFarm.c.user_id == user_id,
                UserFarm.c.farm_id == farm_id,
            ))).fetchone()
        if not has_access:
            raise NotFound()

        def create():
            cu = self.stripe_customer(user_id)
            return cu.subscriptions.create(plan=self.PLANS[plan]['id'])
        if farm._stripe_sub_id:
            # changing an existing subscription
            sub = self.stripe.Subscription.retrieve(farm._stripe_sub_id)
            if user_id != farm.payer_id:
                # different payer
                sub.delete()
                sub = create()
            else:
                # same payer
                new_plan = self.PLANS[plan]['id']
                if new_plan != sub.plan:
                    # different plan
                    sub.plan = self.PLANS[plan]['id']
                    sub.save()
        else:
            # creating a new subscription for this farm
            sub = create()
        
        # update local stuff
        exp_date = unix2date(sub.current_period_end).date()
        self.engine.execute(
            Farm.update()
            .values(
                payer_id=user_id,
                service_expiration=exp_date,
                _stripe_sub_id=sub.id,
            )
            .where(Farm.c.id == farm_id))
        return sub

    @policy.allow(anything)
    def cancel_subscription(self, farm_id):
        """
        Cancel a farm subscription
        """
        farm = self.engine.execute(
            select([
                Farm.c._stripe_sub_id,
                Farm.c.payer_id,
            ])
            .where(Farm.c.id == farm_id)).fetchone()
        sub = self.stripe.Subscription.retrieve(farm._stripe_sub_id)
        sub.delete()
        return sub

    @policy.allow(anything)
    def get_subscription(self, farm_id):
        """
        Return a farm's subscription
        """
        farm = self.engine.execute(
            select([
                Farm.c._stripe_sub_id,
                Farm.c.payer_id,
            ])
            .where(Farm.c.id == farm_id)).fetchone()
        if farm._stripe_sub_id:
            return self.stripe.Subscription.retrieve(farm._stripe_sub_id)
        return None

    @policy.allow(anything)
    def sync_service_expiration(self, subscription_id):
        """
        Update all farms for this subscription to match the Stripe-stored
        expiration date.
        """
        sub = self.stripe.Subscription.retrieve(subscription_id)
        exp_date = unix2date(sub.current_period_end).date()
        self.engine.execute(
            Farm.update()
            .values(service_expiration=exp_date)
            .where(Farm.c._stripe_sub_id == subscription_id))
