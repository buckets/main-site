import {Store, DataEvent} from '../../store';
import {Account, isAccount} from '../../models/account';

console.log('console OUTPUT');
console.log('console OUTPUT');
console.log('console OUTPUT');
console.log('console OUTPUT');
console.log('console OUTPUT');
console.log('console OUTPUT');
console.log('console OUTPUT');
console.log('console OUTPUT');
console.log('console OUTPUT');

test('hello', () => {
  console.log('console OUTPUT');
  console.error('ERROR');
  expect(true).toEqual(false);
})
// let store:Store;
// let events:Array<DataEvent>;
// beforeEach(() => {
//   console.log('beforeach');
//   store = new Store(':memory:');
//   // await store.open();
//   console.log('store opened');
//   events = [];
//   store.data.subscribe(message => {
//     events.push(message as DataEvent);
//   })
// })

// describe('add account', () => {
//   let ev:DataEvent;
//   beforeEach(async () => {
//     await store.accounts.add('Checking');
//     ev = events[0];
//   })
//   test('event', () => {
//     expect(ev.event).toEqual('update');
//   });
//   test('obj', () => {
//     let obj = ev.obj as Account;
//     expect(obj.id).not.toEqual(null);
//     expect(obj._type).toEqual('account');
//     expect(obj.name).toEqual('Checking');
//     expect(obj.balance).toEqual(0);
//   })
//   test('stored in database', async () => {
//     let obj = await store.getObject('account', ev.obj.id);
//     expect(obj.id).toEqual(ev.obj.id);
//     expect(obj._type).toEqual('account');
//     expect(true).toEqual(false);
//   })
// })
