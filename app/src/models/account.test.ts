import {isObj} from '../store';
import {Account, Transaction} from './account';
import {test} from 'tap';
import { getStore } from './testutil';

//-----------------------------
// Tests
//-----------------------------

test('add account', async (t) => {
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

test('list accounts', async (t) => {
  let { store } = await getStore();
  let a1 = await store.accounts.add('Checking');
  let a2 = await store.accounts.add('Savings');
  let a3 = await store.accounts.add('Ally');

  let accounts = await store.accounts.list();
  t.same(accounts, [a3, a1, a2]);
})

test('update account', async (t) => {
  let { store, events } = await getStore();
  let account = await store.accounts.add('Checking');
  events.length = 0;
  let new_account = await store.accounts.update(account.id, {name: 'Bono'});

  t.equal(account.id, new_account.id);
  t.equal(new_account.name, 'Bono');
  t.equal(events[0].event, 'update');
  t.same(events[0].obj, new_account);
})

test('transact', async (t) => {
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

test('transact, null account', async t => {
  let { store, events } = await getStore();
  events.length = 0;
  try {
    await store.accounts.transact({
      account_id: null,
      amount: 500,
      memo: 'hello'});
    t.fail('Should have throw up');
  } catch(err) {
    t.pass('threw an error for a null account');
  }
})

test('balances', async (t) => {
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

test('deleteTransactions', async (t) => {
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

test('listTransactions', async (t) => {
  let { store } = await getStore()
  let acc1 = await store.accounts.add('Checking')
  let acc2 = await store.accounts.add('Savings')
  let t1 = await store.accounts.transact({
    account_id: acc1.id,
    amount: 1,
    memo: 'first',
    posted: '2000-01-01',
  })
  let t2 = await store.accounts.transact({
    account_id: acc1.id,
    amount: 2,
    memo: 'second',
    posted: '2000-02-01',
  })
  let t3 = await store.accounts.transact({
    account_id: acc2.id,
    amount: 3,
    memo: 'other',
    posted: '2000-02-01',
  })

  await t.test('no args', async (tt) => {
    let trans = await store.accounts.listTransactions()
    tt.same(trans, [t2, t3, t1])
  })
  await t.test('onOrAfter', async (tt) => {
    let trans = await store.accounts.listTransactions({posted: {onOrAfter: '2000-02-01 00:00:00'}})
    tt.same(trans, [t2, t3])
  })
  await t.test('before', async (tt) => {
    let trans = await store.accounts.listTransactions({posted: {before: '2000-02-01 00:00:00'}})
    tt.same(trans, [t1])
  })
  await t.test('account_id', async (tt) => {
    let trans = await store.accounts.listTransactions({account_id: acc1.id})
    tt.same(trans, [t2, t1])
    trans = await store.accounts.listTransactions({account_id: acc2.id})
    tt.same(trans, [t3])
  })
})
