import {callOnce} from '../promise';
import {} from 'jest';

test('should return a promise producer', () => {
  expect.assertions(3);
  let a = [];
  let producer = callOnce(() => {
    a.push('foo');
    return Promise.resolve(a.length);
  })
  return Promise.all([
    producer().then(value => expect(value).toEqual(1)),
    producer().then(value => expect(value).toEqual(1)),
  ]).then(() => {
    expect(a).toEqual(['foo']);
  })
});
