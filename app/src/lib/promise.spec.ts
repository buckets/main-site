import {callOnce} from './promise';
import {expect} from 'chai';
import 'mocha'

test('should return a promise producer', () => {
  let a = [];
  let producer = callOnce(() => {
    a.push('foo');
    return Promise.resolve(a.length);
  })
  return Promise.all([
    producer().then(value => expect(value).to.equal(1)),
    producer().then(value => expect(value).to.equal(1)),
  ]).then(() => {
    expect(a).to.eq(['foo']);
  })
});
