import {rankBetween} from './ranking'
import * as tap from 'tap';

tap.Test.prototype.addAssert('between', 3, function(a, x, b, message, extra) {
  message = message || `${x} should be between ${a} and ${b}`
  if (x > a && x < b) {
    return this.pass(message);
  } else {
    return this.fail(message, extra);
  }
})

tap.test('null, null', async t => {
  t.between('a', rankBetween(null, null), 'z')
})
tap.test('null, letter', async t => {
  t.between('a', rankBetween(null, 'z'), 'z')
})
tap.test('letter, null', async t => {
  t.between('a', rankBetween('a', null), 'z')
})
tap.test('letter, letter', async t => {
  t.between('b', rankBetween('b', 'd'), 'd')
})
tap.test('double letter', async t => {
  t.between('b', rankBetween('b', 'c'), 'c')
})
tap.test('many, many', async t => {
  t.between('bbbb', rankBetween('bbbb', 'bbc'), 'bbc')
})
tap.test('uneven', async t => {
  t.between('a', rankBetween('a', 'hhh'), 'hhh')
})
tap.test('wrong order', async t => {
  t.between('b', rankBetween('c', 'b'), 'c')
})
tap.test('same letter', async t => {
  try {
    rankBetween('b', 'b')
    t.fail('should have errored');
  } catch(err) {
    t.pass('threw error');
  }
})
