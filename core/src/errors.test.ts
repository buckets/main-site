import { CustomError } from './errors'
import * as tap from 'tap';

tap.test('instanceof', t => {
  class MyError extends CustomError {}
  try {
    throw new MyError("hello");
  } catch(err) {
    t.ok(err instanceof MyError);
    t.ok(err instanceof Error);
  }
  t.end()
})
tap.test('stack', t => {
  class AnotherError extends CustomError {}
  try {
    throw new AnotherError("foobar");
  } catch(err) {
    t.ok(err.stack !== undefined);
  }
  t.end();
})
tap.test('name', t => {
  class FooError extends CustomError {}
  try {
    throw new FooError("foobar");
  } catch(err) {
    t.ok(err.name === 'FooError');
  }
  t.end();
})