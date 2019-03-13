import { test } from 'tap'
import { TransactionIDGenerator } from './genfiid'

test('same each time, but unique within import set', async t => {
  let gen1 = new TransactionIDGenerator();
  let a1 = gen1.makeID(["foo", "bar", "baz"]);
  let a2 = gen1.makeID(["foo", "bar", "baz"]);
  t.notEqual(a1, a2);

  let gen2 = new TransactionIDGenerator();
  let b1 = gen2.makeID(["foo", "bar", "baz"]);
  let b2 = gen2.makeID(["foo", "bar", "baz"]);
  t.equal(b1, a1, "Should generate the same id for the same transaction");
  t.equal(b2, a2);
})
