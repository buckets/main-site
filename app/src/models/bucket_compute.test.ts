import * as moment from 'moment'
import {test} from 'tap'
import {Bucket, computeBucketData} from './bucket'

function mkBucket(data?:Partial<Bucket>) {
  let b = new Bucket();
  Object.assign(b, data || {});
  return b;
}

test('plain bucket', async t => {
  let b = mkBucket();
  t.equal(computeBucketData(b.kind, b).deposit, 0);
})

test('deposit bucket', async t => {
  let b = mkBucket({kind: 'deposit', deposit: 150})
  t.equal(computeBucketData(b.kind, b).deposit, 150);
})

test('goal and deposit', async t => {
  let b = mkBucket({kind: 'goal-deposit', goal: 12, deposit: 1})
  let computed = computeBucketData(b.kind, b, {today: '2000-01-01', balance: 0})
  t.equal(computed.deposit, 1)
  t.equal(computed.goal, 12)
  t.equal(computed.end_date.format('L'), moment('2001-01-01').format('L'))
})

test('goal-deposit 2', async t => {
  let b = mkBucket({kind: 'goal-deposit', goal:4000, deposit:500})
  let computed = computeBucketData(b.kind, b, {today: '2017-07-28', balance: 2500})
  t.equal(computed.end_date.format('L'), moment('2017-10-01').format('L'))
})

test('goal and end date', async t => {
  let b = mkBucket({kind: 'goal-date', goal: 12, end_date: '2000-12-01'})
  let computed = computeBucketData(b.kind, b, {today: '2000-01-01', balance: 0})
  t.equal(computed.deposit, 1)
  t.equal(computed.goal, 12)
  t.equal(computed.end_date.format('L'), moment('2000-12-01').format('L'))
})
test('deposit and end date', async t => {
  let b = mkBucket({kind: 'deposit-date', deposit: 10, end_date: '2000-05-01'})
  let computed = computeBucketData(b.kind, b, {today: '2000-01-01', balance: 0})
  t.equal(computed.deposit, 10)
  t.equal(computed.goal, 50)
  t.equal(computed.end_date.format('L'), moment('2000-05-01').format('L'))
})

test('goal chete', async t => {
  let b = mkBucket({kind: 'goal-deposit', goal: 12, deposit: 0})
  let computed = computeBucketData(b.kind, b, {today: '2000-01-01', balance: 0})
  t.equal(computed.deposit, 0)
  t.equal(computed.goal, 12)
  t.equal(computed.end_date, null)
})