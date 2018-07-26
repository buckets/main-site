import { test } from 'tap'
import { getStore } from './testutil';

// import { isObj } from '../store';
// import { Bucket } from './bucket';
// import { Account } from './account'
// import { parseLocalTime } from '../time'

test('turn account into a debt account', async (t) => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');

  account = await store.sub.accounts.setDebtMode(account.id, true);
  t.ok(account.is_debt);
})

test('creating a transaction adds to the debt payment', async t => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);

  await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  let bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 1000);
})

test('updating a transaction amount updates the debt payment', async t => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);

  let tx = await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  let bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 1000);

  tx = await store.sub.accounts.updateTransaction(tx.id, {amount: -1500});
  t.equal(tx.amount, -1500)
  t.equal(tx.memo, 'some memo')

  bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 1500);
});

test('deleting a transaction updates the debt payment', async t => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);

  let tx = await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  let bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 1000);

  await store.sub.accounts.deleteTransactions([tx.id])

  bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 0);
});

test('switch accounts on a transaction updates the debt payment', async t => {
  let { store } = await getStore();
  let debt_account = await store.sub.accounts.add('Credit Card');
  let norm_account = await store.sub.accounts.add('Checking');
  await store.sub.accounts.setDebtMode(debt_account.id, true);

  let tx = await store.sub.accounts.transact({
    account_id: debt_account.id,
    amount: -1000,
    memo: 'some memo',
  });

  let debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket.balance, 1000);

  // Switch from debt to norm account
  await store.sub.accounts.updateTransaction(tx.id, {
    account_id: norm_account.id,
  })

  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket.balance, 0);
  let bucket_transactions = await store.sub.buckets.listTransactions({})
  t.equal(bucket_transactions.length, 0, "Should remove linked bucket transaction");

  // Switch from norm to debt account
  await store.sub.accounts.updateTransaction(tx.id, {
    account_id: debt_account.id,
  })
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket.balance, 1000);
  bucket_transactions = await store.sub.buckets.listTransactions({})
  t.equal(bucket_transactions.length, 1, "Should have linked bucket transaction");
})

test('closing a debt account will kick the bucket', async t => {
  let { store } = await getStore();
  let debt_account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(debt_account.id, true);
  let debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked);
  
  await store.sub.accounts.close(debt_account.id);
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket, null, "Closing debt account should kick debt payment bucket");

  await store.sub.accounts.unclose(debt_account.id);
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked, "Unclosing debt account should unkick debt payment bucket");
})

test('marking a debt account as off-budget will kick the bucket', async t => {
  let { store } = await getStore();
  let debt_account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(debt_account.id, true);
  let debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked);
  
  await store.sub.accounts.update(debt_account.id, {offbudget: true});
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket, null, "Making a debt account off budget should kick debt payment bucket")
  debt_account = await store.sub.accounts.get(debt_account.id);
  t.notOk(debt_account.is_debt, "Making a debt account off budget should make it not a debt account");

  await store.sub.accounts.setDebtMode(debt_account.id, true);
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked, "Setting an off-budget account to debt mode should unkick the debt bucket");
  debt_account = await store.sub.accounts.get(debt_account.id);
  t.ok(debt_account.is_debt, "Setting an off-budget account to debt mode should mark it as a debt account");
  t.notOk(debt_account.offbudget, "Setting an off-budget account to debt mode should mark it as not offbudget anymore");
})
