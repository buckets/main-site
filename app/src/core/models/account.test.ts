import {DBStore, ObjectEvent, isObj} from '../store';
import {Account, Transaction} from './account';
// import {expect} from 'chai';
// import 'mocha';
import * as tap from 'tap';

//-----------------------------
// Utilities
//-----------------------------

async function getStore():Promise<{store:DBStore, events:ObjectEvent[]}> {
  let store = new DBStore(':memory:');
  let events = [];
  await store.open();
  store.data.on('obj', message => {
    events.push(message as ObjectEvent);
  })
  return {store, events}
}

//-----------------------------
// Tests
//-----------------------------

tap.test('add account', async (t) => {
  let { store, events } = await getStore();
  let account = await store.accounts.add('Checking');

  // event
  t.equal(events.length, 1);
  let ev = events[0];
  t.equal(ev.event, 'update');
  if (!isObj(Account, ev.obj)) {
    t.fail('should be an Account');
  }
  let obj = ev.obj as Account;
  t.notEqual(obj.id, null);
  t.notEqual(obj.created, null);
  t.equal(obj._type, 'account');
  t.equal(obj.name, 'Checking');
  t.equal(obj.balance, 0);
  t.equal(obj.currency, 'USD');  
  
  t.same(account, obj);

  // stored in the database
  let stored = await store.getObject(Account, ev.obj.id);
  t.same(stored, account);
})

tap.test('transact', async (t) => {
  let { store, events } = await getStore();
  let account = await store.accounts.add('Savings');
  events.length = 0;
  let orig = await store.accounts.transact({
    account_id: account.id,
    amount: 800,
    memo: 'something'});

  // events
  t.equal(events.length, 2);

  // transaction event
  let ev0 = events[0];
  t.equal(ev0.event, 'update');
  if (!isObj(Transaction, ev0.obj)) {
    t.fail('should be a Transaction');
  }
  let trans = ev0.obj as Transaction;
  t.equal(trans.amount, 800)
  t.equal(trans.memo, 'something')
  t.equal(trans.account_id, account.id);

  t.same(orig, trans);

  // account event
  let ev1 = events[1];
  t.equal(ev1.event, 'update');
  if (!isObj(Account, ev1.obj)) {
    t.fail('should be an Account');
  }
  let new_account = ev1.obj as Account
  t.equal(new_account.balance, 800);
})

tap.test('balances', async (t) => {
  let { store } = await getStore();
  let a1 = await store.accounts.add('Savings');
  let a2 = await store.accounts.add('Checking');

  await store.accounts.transact({
    account_id: a1.id,
    amount: 800,
    memo: 'something',
    posted: '2000-01-01 00:00:00',
  });
  await store.accounts.transact({
    account_id: a2.id,
    amount: 750,
    memo: 'heyo',
    posted: '2001-01-01 00:00:00',
  })

  // before any transactions
  let bal = await store.accounts.balances('1999-01-01');
  t.same(bal, {
    [a1.id]: 0,
    [a2.id]: 0,
  })

  // after the first transaction
  bal = await store.accounts.balances('2000-06-06')
  t.same(bal, {
    [a1.id]: 800,
    [a2.id]: 0,
  })

  // after both transactions
  bal = await store.accounts.balances('2001-06-06')
  t.same(bal, {
    [a1.id]: 800,
    [a2.id]: 750,
  })

  // now
  bal = await store.accounts.balances()
  t.same(bal, {
    [a1.id]: 800,
    [a2.id]: 750,
  })
})

tap.test('deleteTransactions', async (t) => {
  let { store, events } = await getStore()
  let a = await store.accounts.add('Checking');
  let tr = await store.accounts.transact({
    account_id: a.id,
    amount: 750,
    memo: 'hey',
  })
  events.length = 0;

  await store.accounts.deleteTransactions([tr.id])

  // transaction event
  t.equal(events.length, 2);
  let tev = events[0]
  t.equal(tev.event, 'delete')
  t.same(tev.obj, tr)

  // account event
  let aev = events[1]
  t.equal(aev.event, 'update')
  t.ok(isObj(Account, aev.obj))
  let new_a = aev.obj as Account;
  t.equal(new_a.balance, 0, "Should return the balance to 0")
})

tap.test('listTransactions', async (t) => {
  let { store } = await getStore()
  let a = await store.accounts.add('Checking')
  let t1 = await store.accounts.transact({
    account_id: a.id,
    amount: 1,
    memo: 'first',
    posted: '2000-01-01',
  })
  let t2 = await store.accounts.transact({
    account_id: a.id,
    amount: 2,
    memo: 'second',
    posted: '2000-02-01',
  })

  let trans = await store.accounts.listTransactions({
    limit: 5,
  })
  t.equal(trans.length, 2)
  t.same(trans[0], t2)
  t.same(trans[1], t1)
})

// describe('transact', () => {
//   let account;
//   let trans;
//   beforeEach(async () => {
//     account = await store.accounts.add('Checking');
//     events.length = 0;
//     trans = await store.accounts.transact(account.id, 800, 'something important');
//   })
//   it('2 events', () => {
//     expect(events.length).to.eq(2);
//   });
//   it('should emit the new transaction', () => {
//     let tevent = events[0];
//     expect(tevent.event).to.eq('update');
//     expect(isObj(Transaction, tevent.obj)).to.eq(true);
//     let t = <Transaction>tevent.obj;
//     expect(t.amount).to.eq(800);
//     expect(t.memo).to.eq('something important');
//     expect(t.account_id).to.eq(account.id);
//   })
//   it('should emit the new account', () => {
//     let aevent = events[1];
//     expect(aevent.event).to.eq('update');
//     expect(isObj(Account, aevent.obj)).to.eq(true);
//     let a = <Account>aevent.obj;
//     expect(a.balance).to.eq(800);
//   })

//   describe('listTransactions', () => {
    
//   })
