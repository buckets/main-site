import {Store, DataEvent} from '../actions';
import * as A from '../actions';
import {} from 'jest';

let store:Store;
let events:Array<DataEvent>;
beforeEach(() => {
  store = new Store(':memory:');
  events = [];
  store.data.subscribe(message => {
    events.push(message as DataEvent);
  })
})

describe('add account', () => {
  let ev:DataEvent;
  beforeEach(() => {
    store.accounts.add('Checking');
    ev = events[0];
  })
  test('update event', () => {
    expect(ev.type).toEqual('update');
  });
  test('event obj', () => {
    let obj:A.IAccount = ev.object;
    expect(obj.name).toEqual('Checking');
    expect(obj.balance).toEqual(0);
  })
  test('stored in database', () => {
    expect(true).toEqual(false);
  })
})
