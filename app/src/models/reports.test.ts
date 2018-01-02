import { Bucket, Transaction } from './bucket';
import { test } from 'tap';
import { getStore } from './testutil';

test('mortgage', async (t) => {
  let { store, events } = await getStore();
  let bucket = await store.buckets.add({name: 'mortgage'});
  [
    '2010-01-01 10:00:00',
    '2010-02-01 10:00:00',
    '2010-03-01 10:00:00',
    '2010-04-01 10:00:00',
    '2010-05-01 10:00:00',
    '2010-06-01 10:00:00',
    '2010-07-01 10:00:00',
    '2010-08-01 10:00:00',
    '2010-09-01 10:00:00',
    '2010-10-01 10:00:00',
    '2010-11-01 10:00:00',
    '2010-12-01 10:00:00',
    '2011-01-01 10:00:00',
    '2011-02-01 10:00:00',
  ].forEach(async tstamp => {
    await store.buckets.transact({
      bucket_id: bucket.id,
      amount: 1000,
      posted: tstamp,
    })
    await store.buckets.transact({
      bucket_id: bucket.id,
      amount: -1000,
      posted: tstamp,
    })
  })
})
