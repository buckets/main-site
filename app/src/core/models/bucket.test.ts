import {isObj} from '../store';
import {getStore} from './account.test'
import {test} from 'tap'
import {Bucket} from './bucket';

test('add bucket', async (t) => {
  let { store, events } = await getStore();
  let bucket = await store.buckets.add({name: 'Food'});

  // event
  t.equal(events.length, 1)
  t.equal(events[0].event, 'update')
  t.same(events[0].obj, bucket);

  // obj
  if (!isObj(Bucket, bucket)) {
    t.fail('should be a Bucket');
  }
  t.notEqual(bucket.id, null)
  t.equal(bucket.name, 'Food')
  t.equal(bucket.notes, '')
  t.equal(bucket.balance, 0)
  t.equal(bucket.kicked, false)
  t.equal(bucket.group_id, null)
  t.equal(bucket.ranking, '')
  t.equal(bucket.kind, '')
})

test('list buckets', async (t) => {
  let { store } = await getStore();
  let b1 = await store.buckets.add({name: 'Food'})
  let b2 = await store.buckets.add({name: 'Shelter'})
  let b3 = await store.buckets.add({name: 'Apples'})

  let buckets = await store.buckets.list();
  t.same(buckets, [b3, b1, b2]);
})

test('update bucket', async (t) => {
  let { store, events } = await getStore();
  let b1 = await store.buckets.add({name: 'Garbage'})
  events.length = 0;

  let b2 = await store.buckets.update(b1.id, {
    name: 'Foobar',
    kind: 'goal',
    ranking: 'h',
    kicked: true,
    notes: 'some notes',
    group_id: 5,
  })
  t.equal(b2.name, 'Foobar')
  t.equal(b2.kind, 'goal')
  t.equal(b2.ranking, 'h')
  t.equal(b2.kicked, true)
  t.equal(b2.notes, 'some notes')
  t.equal(b2.group_id, 5)

  t.equal(events[0].event, 'update')
  t.same(events[0].obj, b2)
})

test('transact', async t => {
  let { store, events } = await getStore();
  let bucket = await store.buckets.add({name: 'Food'})
  events.length = 0;

  let trans = await store.buckets.transact({
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
  let newbucket = await store.buckets.get(bucket.id);
  t.same(ev1.obj, newbucket);
  t.equal(newbucket.id, bucket.id)
  t.equal(newbucket.balance, 500)
})

test('deleteTransactions', async (t) => {
  let { store, events } = await getStore()
  let bucket = await store.buckets.add({name: 'Grocery'});
  let tr = await store.buckets.transact({
    bucket_id: bucket.id,
    amount: 750,
    memo: 'hey',
  })
  events.length = 0;

  await store.buckets.deleteTransactions([tr.id])

  // transaction event
  t.equal(events.length, 2);
  let tev = events[0]
  t.equal(tev.event, 'delete')
  t.same(tev.obj, tr)

  // account event
  let bucket_ev = events[1]
  t.equal(bucket_ev.event, 'update')
  t.ok(isObj(Bucket, bucket_ev.obj))
  let new_bucket = bucket_ev.obj as Bucket;
  t.equal(new_bucket.balance, 0, "Should return the balance to 0")
})