import { test } from 'tap'
import { getStore } from './testutil';

// import { isObj } from '../store';
// import { Bucket } from './bucket';
// import { Account } from './account'
// import { parseLocalTime } from '../time'

test('turn account into a debt account', async (t) => {
  let { store, events } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  events.length = 0;

  account = await store.sub.accounts.setDebtMode(account.id, true);
  t.equal(account.debt_payment, 0)
  t.ok(account.is_debt);
})

test('creating a transaction adds to the debt_payment', async t => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);

  await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  account = await store.sub.accounts.get(account.id);
  t.equal(account.debt_payment, 1000);
})
test('updating a transaction amount updates the debt_payment', async t => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);

  let tx = await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  account = await store.sub.accounts.get(account.id);
  t.equal(account.debt_payment, 1000);

  await store.sub.accounts.updateTransaction(tx.id, {amount: -1500});

  account = await store.sub.accounts.get(account.id);
  t.equal(account.debt_payment, 1500);
});

test('deleting a transaction updates the debt_payment', async t => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);

  let tx = await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  account = await store.sub.accounts.get(account.id);
  t.equal(account.debt_payment, 1000);

  await store.sub.accounts.deleteTransactions([tx.id])

  account = await store.sub.accounts.get(account.id);
  t.equal(account.debt_payment, 0);
});

test('switch accounts on a transaction updates the debt_payment', async t => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  let account2 = await store.sub.accounts.add('Checking');
  await store.sub.accounts.setDebtMode(account.id, true);

  let tx = await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  account = await store.sub.accounts.get(account.id);
  t.equal(account.debt_payment, 1000);

  await store.sub.accounts.updateTransaction(tx.id, {
    account_id: account2.id,
  })

  account = await store.sub.accounts.get(account.id);
  t.equal(account.debt_payment, 0);
})
