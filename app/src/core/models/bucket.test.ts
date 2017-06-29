import {isObj} from '../store';
import {getStore} from './account.test'
import {test} from 'tap'
import {Bucket, Transaction} from './bucket';

test('add bucket', async (t) => {
  let { store, events } = await getStore();
  let bucket = await store.buckets.add({name: 'Food'});

  // event
  t.equal(events.length, 1)
  t.equal(events[0].event, 'update')
  t.same(events[0].obj, bucket);

  if (!isObj(Bucket, bucket)) {
    t.fail('should be a Bucket');
  }
  t.notEqual(bucket.id, null)
  t.equal(bucket.name, 'Food')
  t.equal(bucket.notes, '')
  t.equal(bucket.balance, 0)
  t.equal(bucket.kicked, false)
  t.equal(bucket.group_id, null)
  t.equal(bucket.ranking, 'm')
  t.equal(bucket.kind, '')
})