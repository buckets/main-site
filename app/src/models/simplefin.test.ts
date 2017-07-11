import * as tap from 'tap'
import * as _ from 'lodash'
import { parseStringAmount } from './simplefin'

const test = tap.test;

test('parseStringAmount', t => {
  let expectations = {
    '-3323.23': -332323,
    '200': 20000,
    '0.01': 1,
    '-.01': -1,
    '-0.': 0,
    '0.2': 20,
    '-1,300': -130000,
  }

  _.each(expectations, (val, key) => {
    t.equal(parseStringAmount(key), val, `Expected ${key} -> ${val}`);
  })
  t.end()
})
