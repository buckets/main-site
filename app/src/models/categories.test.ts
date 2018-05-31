import {test} from 'tap'
import {isObj} from '../store';
import { getStore } from './testutil';
import {Failure} from './account';
import {Bucket, Transaction as BTrans} from './bucket';
import {Transaction as ATrans} from './account';
import { parseLocalTime } from 'buckets-core/dist/time'

async function setup(amount=1000) {
  let { store, events } = await getStore();
  let b1 = await store.sub.buckets.add({name: 'Food'})
  let b2 = await store.sub.buckets.add({name: 'Gas'})
  let account = await store.sub.accounts.add('Checking');
  let trans = await store.sub.accounts.transact({
    account_id: account.id,
    amount: amount,
    memo: 'foobar',
    posted: parseLocalTime('2001-01-01 00:00:00'),
  });
  events.length = 0;
  return { store, events, b1, b2, account, trans }
}

test('1 trans 1 bucket', async t => {
  let { store, events, b1:bucket, trans } = await setup();

  await store.sub.accounts.categorize(trans.id, [{
    bucket_id: bucket.id,
    amount: 1000,
  }]);

  // events
  t.equal(events.length, 3)

  // bucket transaction event
  let bt_ev = events[0];
  t.equal(bt_ev.event, 'update')
  t.ok(isObj(BTrans, bt_ev.obj))

  // bucket event
  let b_ev = events[1];
  t.equal(b_ev.event, 'update')
  t.ok(isObj(Bucket, b_ev.obj))
  let newbucket = b_ev.obj as Bucket;
  t.equal(newbucket.id, bucket.id);
  t.equal(newbucket.balance, 1000);

  // account transaction event
  let at_ev = events[2];
  t.equal(at_ev.event, 'update')
  t.same(at_ev.obj, trans)

  // bucket transaction
  let btrans = bt_ev.obj as BTrans;
  t.equal(btrans.amount, 1000)
  t.equal(btrans.account_trans_id, trans.id)
  t.equal(btrans.posted, trans.posted)
  t.equal(btrans.memo, trans.memo)

  let categories = await store.sub.accounts.getCategories(trans.id)
  t.equal(categories.length, 1)
  t.same(categories[0], {
    bucket_id: bucket.id,
    amount: 1000,
  })
})

test('1 trans 2 buckets', async t => {
  let { store, events, b1, b2, trans } = await setup();

  await store.sub.accounts.categorize(trans.id, [
  {
    bucket_id: b1.id,
    amount: 600,
  },
  {
    bucket_id: b2.id,
    amount: 400,
  }])

  // events
  t.equal(events.length, 5, "2 for the buckets, 2 for the btrans, 1 for the trans");
  
  let newb1 = await store.sub.buckets.get(b1.id);
  t.equal(newb1.balance, 600);

  let newb2 = await store.sub.buckets.get(b2.id);
  t.equal(newb2.balance, 400);

  let b1trans = (await store.sub.buckets.listTransactions({bucket_id: b1.id}))[0];
  t.equal(b1trans.amount, 600);

  let b2trans = (await store.sub.buckets.listTransactions({bucket_id: b2.id}))[0];
  t.equal(b2trans.amount, 400);
})

test('switch categories', async t => {
  let { store, events, b1, b2, trans } = await setup();

  // first category
  await store.sub.accounts.categorize(trans.id, [
  {
    bucket_id: b1.id,
    amount: 1000,
  }]);
  events.length = 0;

  // second category
  await store.sub.accounts.categorize(trans.id, [
  {
    bucket_id: b2.id,
    amount: 1000,
  }]);

  t.equal(events.length, 5, "2 for the old bucket+trans, 2 for the new bucket+trans, 1 for the trans")

  let newb1 = await store.sub.buckets.get(b1.id);
  t.equal(newb1.balance, 0);

  let newb2 = await store.sub.buckets.get(b2.id);
  t.equal(newb2.balance, 1000);

  let b1trans = await store.sub.buckets.listTransactions({bucket_id: b1.id});
  t.equal(b1trans.length, 0, "Should be deleted");

  let b2trans = (await store.sub.buckets.listTransactions({bucket_id: b2.id}))[0];
  t.equal(b2trans.amount, 1000);
})

test('wrong total', async t => {
  let { store, b1, trans } = await setup();

  return t.rejects(() => {
    return store.sub.accounts.categorize(trans.id, [
      {
        bucket_id: b1.id,
        amount: 750,
      },
    ])
  }, Failure, {})
})

test('wrong total 2 buckets', async t => {
  let { store, b1, b2, trans } = await setup();

  return t.rejects(() => {
    return store.sub.accounts.categorize(trans.id, [
      {
        bucket_id: b1.id,
        amount: 750,
      },
      {
        bucket_id: b2.id,
        amount: 100,
      },
    ])
  }, Failure, {})
})

test('negative', async t => {
  let { store, b1:bucket, trans } = await setup(-1000);

  await store.sub.accounts.categorize(trans.id, [
    {
      bucket_id: bucket.id,
      amount: -1000,
    },
  ]);

  let newb1 = await store.sub.buckets.get(bucket.id);
  t.equal(newb1.balance, -1000);
})

test('negative sign mismatch', async t => {
  let { store, b1:bucket, trans } = await setup(-1000);

  await t.rejects(() => {
    return store.sub.accounts.categorize(trans.id, [
      {
        bucket_id: bucket.id,
        amount: 1000,
      },
    ]);
  }, Failure, 'message', {});
})

test('positive sign mismatch', async t => {
  let { store, b1:bucket, trans } = await setup(1000);

  await t.rejects(() => {
    return store.sub.accounts.categorize(trans.id, [
      {
        bucket_id: bucket.id,
        amount: -1000,
      },
    ]);
  }, Failure, 'message', {});
})

test('categorize as income', async t => {
  let { store, events, trans } = await setup();

  await store.sub.accounts.categorizeGeneral(trans.id, 'income');
  t.equal(events.length, 1)
  let newtrans = events[0].obj as ATrans;
  t.equal(newtrans.id, trans.id)
  t.equal(newtrans.general_cat, 'income');
})