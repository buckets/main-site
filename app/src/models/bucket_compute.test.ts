import * as moment from 'moment'
import {test} from 'tap'
import {Bucket, computeBucketData} from './bucket'

function mkBucket(data?:Partial<Bucket>) {
  let b = new Bucket();
  Object.assign(b, data || {});
  return b;
}

//----------------------------------------------------------------
// normal type
//----------------------------------------------------------------
test('plain bucket', async t => {
  let b = mkBucket();
  t.equal(computeBucketData(b.kind, b).deposit, 0);
})

//----------------------------------------------------------------
// deposit type
//----------------------------------------------------------------
test('deposit bucket', async t => {
  let b = mkBucket({kind: 'deposit', deposit: 150})
  t.equal(computeBucketData(b.kind, b).deposit, 150);
})

//----------------------------------------------------------------
// goal type
//----------------------------------------------------------------
test('goal and deposit', async t => {
  let b = mkBucket({kind: 'goal', goal: 12, deposit: 1})
  let computed = computeBucketData(b.kind, b, {today: '2000-01-01', balance: 0})
  t.equal(computed.deposit, 1)
  t.equal(computed.goal, 12)
  t.equal(computed.end_date.format('L'), moment('2000-12-01').format('L'))
})
test('goal and end date', async t => {
  let b = mkBucket({kind: 'goal', goal: 12, end_date: '2000-12-01'})
  let computed = computeBucketData(b.kind, b, {today: '2000-01-01', balance: 0})
  t.equal(computed.deposit, 1)
  t.equal(computed.goal, 12)
  t.equal(computed.end_date.format('L'), moment('2000-12-01').format('L'))
})
test('deposit and end date', async t => {
  let b = mkBucket({kind: 'goal', deposit: 10, end_date: '2000-05-01'})
  let computed = computeBucketData(b.kind, b, {today: '2000-01-01', balance: 0})
  t.equal(computed.deposit, 10)
  t.equal(computed.goal, 50)
  t.equal(computed.end_date.format('L'), moment('2000-05-01').format('L'))
})