import { test } from 'tap'
import { getStore } from './testutil';

import { isObj } from '../store';
import { Bucket } from './bucket';
import { parseLocalTime } from '../time'

test('add bucket', async (t) => {
  let { store, events } = await getStore();
  let bucket = await store.sub.buckets.add({name: 'Food'});

  // event
  t.equal(events.length, 1)
  t.equal(events[0].event, 'update')
  t.same(events[0].obj, bucket);

  // obj
  if (!isObj('bucket', bucket)) {
    t.fail('should be a Bucket');
  }
  t.notEqual(bucket.id, null)
  t.equal(bucket.name, 'Food')
  t.equal(bucket.notes, '')
  t.equal(bucket.balance, 0)
  t.notOk(bucket.kicked)
  t.equal(bucket.group_id, null)
  t.equal(bucket.ranking, 'm')
  t.equal(bucket.kind, '')
})

test('list buckets', async (t) => {
  let { store } = await getStore();
  let b1 = await store.sub.buckets.add({name: 'Food'})
  let b2 = await store.sub.buckets.add({name: 'Shelter'})
  let b3 = await store.sub.buckets.add({name: 'Apples'})

  let buckets = await store.sub.buckets.list();
  t.same(buckets, [b3, b1, b2]);
})

test('update bucket', async (t) => {
  let { store, events } = await getStore();
  let b1 = await store.sub.buckets.add({name: 'Garbage'})
  events.length = 0;

  let b2 = await store.sub.buckets.update(b1.id, {
    name: 'Foobar',
    kind: 'goal-deposit',
    ranking: 'h',
    kicked: true,
    notes: 'some notes',
    group_id: 5,
  })
  t.equal(b2.name, 'Foobar')
  t.equal(b2.kind, 'goal-deposit')
  t.equal(b2.ranking, 'h')
  t.ok(b2.kicked)
  t.equal(b2.notes, 'some notes')
  t.equal(b2.group_id, 5)

  t.equal(events[0].event, 'update')
  t.same(events[0].obj, b2)
})

test('transact', async t => {
  let { store, events } = await getStore();
  let bucket = await store.sub.buckets.add({name: 'Food'})
  events.length = 0;

  let trans = await store.sub.buckets.transact({
    bucket_id: bucket.id,
    amount: 500,
    memo: 'Hello',
  });

  t.equal(trans.amount, 500)
  t.equal(trans.memo, 'Hello')
  t.equal(trans.created, trans.posted);
  t.equal(trans.account_trans_id, null);

  // events
  t.equal(events.length, 2);

  // transaction event
  let ev0 = events[0];
  t.equal(ev0.event, 'update');
  t.same(ev0.obj, trans);

  // bucket event
  let ev1 = events[1];
  t.equal(ev1.event, 'update');
  let newbucket = await store.sub.buckets.get(bucket.id);
  t.same(ev1.obj, newbucket);
  t.equal(newbucket.id, bucket.id)
  t.equal(newbucket.balance, 500)
})

test('balances', async (t) => {
  let { store } = await getStore();
  let b1 = await store.sub.buckets.add({name: 'Food'});
  let b2 = await store.sub.buckets.add({name: 'Volleyball'});

  await store.sub.buckets.transact({
    bucket_id: b1.id,
    amount: 800,
    memo: 'something',
    posted: parseLocalTime('2000-01-01 00:00:00'),
  });
  await store.sub.buckets.transact({
    bucket_id: b2.id,
    amount: 750,
    memo: 'heyo',
    posted: parseLocalTime('2001-01-01 00:00:00'),
  })

  // before any transactions
  let bal = await store.sub.buckets.balances(parseLocalTime('1999-01-01'));
  t.same(bal, {
    [b1.id]: 0,
    [b2.id]: 0,
  })

  // after the first transaction
  bal = await store.sub.buckets.balances(parseLocalTime('2000-06-06'))
  t.same(bal, {
    [b1.id]: 800,
    [b2.id]: 0,
  })

  // after both transactions
  bal = await store.sub.buckets.balances(parseLocalTime('2001-06-06'))
  t.same(bal, {
    [b1.id]: 800,
    [b2.id]: 750,
  })

  // now
  bal = await store.sub.buckets.balances()
  t.same(bal, {
    [b1.id]: 800,
    [b2.id]: 750,
  })
})

test('kick used bucket', async t => {
  let { store, events } = await getStore()
  let bucket = await store.sub.buckets.add({name: 'Grocery'});
  await store.sub.buckets.transact({
    bucket_id: bucket.id,
    amount: 750,
    memo: 'hey',
  })
  events.length = 0;

  await store.sub.buckets.kick(bucket.id);
  t.equal(events.length, 1);
  t.equal(events[0].event, 'update')
  let new_bucket = await store.sub.buckets.get(bucket.id);
  t.same(events[0].obj, new_bucket);
  t.ok(new_bucket.kicked);

  events.length = 0;
  await store.sub.buckets.unkick(bucket.id);
  t.equal(events.length, 1);
  t.equal(events[0].event, 'update');
  new_bucket = await store.sub.buckets.get(bucket.id);
  t.same(events[0].obj, new_bucket);
  t.notOk(new_bucket.kicked);
})

test('kick new bucket', async t => {
  let { store, events } = await getStore()
  let bucket = await store.sub.buckets.add({name: 'Grocery'});
  events.length = 0;

  await store.sub.buckets.kick(bucket.id);
  t.equal(events.length, 1);
  t.equal(events[0].event, 'delete')
  t.same(events[0].obj, bucket);
})

test('deleteTransactions', async (t) => {
  let { store, events } = await getStore()
  let bucket = await store.sub.buckets.add({name: 'Grocery'});
  let tr = await store.sub.buckets.transact({
    bucket_id: bucket.id,
    amount: 750,
    memo: 'hey',
  })
  events.length = 0;

  await store.sub.buckets.deleteTransactions([tr.id])

  // transaction event
  t.equal(events.length, 2);
  let tev = events[0]
  t.equal(tev.event, 'delete')
  t.same(tev.obj, tr)

  // account event
  let bucket_ev = events[1]
  t.equal(bucket_ev.event, 'update')
  t.ok(isObj('bucket', bucket_ev.obj))
  let new_bucket = bucket_ev.obj as Bucket;
  t.equal(new_bucket.balance, 0, "Should return the balance to 0")
})

test('create bucket in group', async t => {
  let { store, events } = await getStore()

  let group = await store.sub.buckets.addGroup({name: 'The Group'})
  t.equal(events.length, 1);
  
  let b = await store.sub.buckets.add({name: 'Bob', group_id: group.id});
  t.equal(b.group_id, group.id);
})

test('update group', async t => {
  let { store, events } = await getStore()
  let group = await store.sub.buckets.addGroup({name: 'The Group'})
  events.length = 0;

  let new_group = await store.sub.buckets.updateGroup(group.id, {name: 'Bob', ranking: 't'})
  t.equal(new_group.name, 'Bob')
  t.equal(new_group.ranking, 't')
  t.same(events[0].obj, new_group);
})

test('group different ranking', async t => {
  let { store } = await getStore()
  let g1 = await store.sub.buckets.addGroup({name: 'Group 1'})
  let g2 = await store.sub.buckets.addGroup({name: 'Group 2'})

  t.ok(g1.ranking < g2.ranking)
})

test('moveBucket 2', async t => {
  let { store, events } = await getStore()
  let b1 = await store.sub.buckets.add({name: 'Grocery'})
  let b2 = await store.sub.buckets.add({name: 'Vacation'})
  events.length = 0;

  t.ok(b1.ranking < b2.ranking, `b1 ${b1.ranking} should be < b2 ${b2.ranking}`)

  await store.sub.buckets.moveBucket(b2.id, 'before', b1.id);
  t.equal(events.length, 1, "Should only notify about the changed bucket")

  b1 = await store.sub.buckets.get(b1.id);
  b2 = await store.sub.buckets.get(b2.id);

  t.same(b2, events[0].obj, "Should emit the bucket changed")
  t.ok(b1.ranking > b2.ranking, "b1 should be after b2 now")

  await store.sub.buckets.moveBucket(b2.id, 'after', b1.id);

  b1 = await store.sub.buckets.get(b1.id);
  b2 = await store.sub.buckets.get(b2.id);

  t.ok(b1.ranking < b2.ranking, `b1 ${b1.ranking} should be < b2 ${b2.ranking}`)
})
test('moveBucket 3', async t => {
  let { store, events } = await getStore()
  let b1 = await store.sub.buckets.add({name: 'Grocery', group_id: 4})
  let b2 = await store.sub.buckets.add({name: 'Vacation', group_id: 4})
  let b3 = await store.sub.buckets.add({name: 'Johnson', group_id: 1})
  events.length = 0;

  await store.sub.buckets.moveBucket(b3.id, 'before', b2.id);
  t.equal(events.length, 1, "Should only notify about the changed bucket")

  b1 = await store.sub.buckets.get(b1.id);
  b2 = await store.sub.buckets.get(b2.id);
  b3 = await store.sub.buckets.get(b3.id);

  t.same(b3, events[0].obj, "Should emit the bucket changed")
  t.ok(b1.ranking < b3.ranking)
  t.ok(b3.ranking < b2.ranking)
  t.equal(b3.group_id, 4)
})
test('moveGroup', async t => {
  let { store } = await getStore()
  let g1 = await store.sub.buckets.addGroup({name: 'Group 1'})
  let g2 = await store.sub.buckets.addGroup({name: 'Group 2'})
  let g3 = await store.sub.buckets.addGroup({name: 'Group 3'})

  t.ok(g1.ranking < g2.ranking)
  t.ok(g2.ranking < g3.ranking)

  await store.sub.buckets.moveGroup(g3.id, 'before', g1.id)

  g1 = await store.sub.buckets.getGroup(g1.id);
  g2 = await store.sub.buckets.getGroup(g2.id);
  g3 = await store.sub.buckets.getGroup(g3.id);

  t.ok(g3.ranking < g1.ranking)
  
  await store.sub.buckets.moveGroup(g3.id, 'after', g1.id)

  g1 = await store.sub.buckets.getGroup(g1.id);
  g2 = await store.sub.buckets.getGroup(g2.id);
  g3 = await store.sub.buckets.getGroup(g3.id);

  t.ok(g1.ranking < g3.ranking)
  t.ok(g3.ranking < g2.ranking)
})