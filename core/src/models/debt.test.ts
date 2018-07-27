import { test } from 'tap'
import { getStore } from './testutil';

test('normal -> debt account', async (t) => {
  let { store } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');

  account = await store.sub.accounts.setDebtMode(account.id, true);
  t.ok(account.is_debt);
})

test('creating a transaction adds to the debt payment', async t => {
  let { store, events } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);
  events.length = 0;

  await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  let bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 1000);

  t.matchAndRemoveObject(events,
    {event: 'update', obj: {
      _type: 'bucket_transaction',
      bucket_id: bucket.id,
    }}, "should publish bucket_transaction update")
 t.matchAndRemoveObject(events,
    {event: 'update', obj: {
      _type: 'bucket',
      id: bucket.id,
    }}, "should publish bucket update")
})

test('updating a transaction amount updates the debt payment', async t => {
  let { store, events } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);
  let tx = await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });
  let bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 1000);

  // Update the transaction
  events.length = 0;
  tx = await store.sub.accounts.updateTransaction(tx.id, {amount: -1500});
  t.equal(tx.amount, -1500)
  t.equal(tx.memo, 'some memo')
  
  // bucket
  bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 1500);
  
  // events
  t.matchAndRemoveObject(events, {
    event: 'update',
    obj: {
      _type: 'bucket_transaction',
      bucket_id: bucket.id,
    }
  }, "should publish bucket transaction update")
  t.matchAndRemoveObject(events, {
    event: 'update',
    obj: {
      _type: 'bucket',
      id: bucket.id,
    }
  }, "should publish bucket update");
});

test('deleting a debt transaction', async t => {
  let { store, events } = await getStore();
  let account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(account.id, true);

  let tx = await store.sub.accounts.transact({
    account_id: account.id,
    amount: -1000,
    memo: 'some memo',
  });

  let bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 1000);
  
  events.length = 0;
  await store.sub.accounts.deleteTransactions([tx.id])

  bucket = await store.sub.accounts.getDebtBucket(account.id);
  t.equal(bucket.balance, 0, "Should adjust bucket balance");

  t.matchAndRemoveObject(events, {
    event: 'delete',
    obj: {
      _type: 'bucket_transaction',
      bucket_id: bucket.id,
    }
  }, "should publish bucket transaction update")
  t.matchAndRemoveObject(events, {
    event: 'update',
    obj: {
      _type: 'bucket',
      id: bucket.id,
    }
  }, "should publish bucket update");
});

test('switch accounts on a transaction updates the debt payment', async t => {
  let { store, events } = await getStore();
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
  events.length = 0;
  await store.sub.accounts.updateTransaction(tx.id, {
    account_id: norm_account.id,
  })

  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket.balance, 0);
  let bucket_transactions = await store.sub.buckets.listTransactions({})
  t.equal(bucket_transactions.length, 0, "Should remove linked bucket transaction");
  t.matchAndRemoveObject(events, {
    event: 'delete',
    obj: {
      _type: 'bucket_transaction',
      bucket_id: debt_bucket.id,
    }
  }, "debt -> norm should publish bucket transaction delete")
  t.matchAndRemoveObject(events, {
    event: 'update',
    obj: {
      _type: 'bucket',
      id: debt_bucket.id,
    }
  }, "debt -> norm should publish bucket update");

  // Switch from norm to debt account
  events.length = 0;
  await store.sub.accounts.updateTransaction(tx.id, {
    account_id: debt_account.id,
  })
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket.balance, 1000);
  bucket_transactions = await store.sub.buckets.listTransactions({})
  t.equal(bucket_transactions.length, 1, "Should have linked bucket transaction");
  t.matchAndRemoveObject(events, {
    event: 'update',
    obj: {
      _type: 'bucket_transaction',
      bucket_id: debt_bucket.id,
    }
  }, "norm -> debt should publish bucket transaction update")
  t.matchAndRemoveObject(events, {
    event: 'update',
    obj: {
      _type: 'bucket',
      id: debt_bucket.id,
    }
  }, "norm -> debt should publish bucket update");
})

test('closing and unclosing a debt account', async t => {
  let { store } = await getStore();
  let debt_account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(debt_account.id, true);
  let debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked);
  
  await store.sub.accounts.close(debt_account.id);
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket, null, "close() should kick debt payment bucket");

  await store.sub.accounts.unclose(debt_account.id);
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked, "unclose() should unkick debt payment bucket");
})

test('debt account -> off-budget account', async t => {
  let { store } = await getStore();
  let debt_account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(debt_account.id, true);
  let debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked);
  
  await store.sub.accounts.update(debt_account.id, {offbudget: true});
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.equal(debt_bucket, null, "should kick debt payment bucket")
  debt_account = await store.sub.accounts.get(debt_account.id);
  t.notOk(debt_account.is_debt, "should make it not a debt account");

  await store.sub.accounts.setDebtMode(debt_account.id, true);
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked, "should unkick the debt bucket");
  debt_account = await store.sub.accounts.get(debt_account.id);
  t.ok(debt_account.is_debt, "should mark it as a debt account");
  t.notOk(debt_account.offbudget, "should mark it as not offbudget anymore");
})

test('debt -> normal account', async t => {
  let { store } = await getStore();
  let debt_account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(debt_account.id, true);
  await store.sub.accounts.transact({
    account_id: debt_account.id,
    amount: 1000,
    memo: 'hello',
  })
  let debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.notOk(debt_bucket.kicked);
  
  // switch it back
  await store.sub.accounts.setDebtMode(debt_account.id, false);
  debt_bucket = await store.sub.accounts.getDebtBucket(debt_account.id);
  t.ok(debt_bucket.kicked, "should kick bucket");
})

test('delete debt account', async t => {
  let { store } = await getStore();
  let debt_account = await store.sub.accounts.add('Credit Card');
  await store.sub.accounts.setDebtMode(debt_account.id, true);
  await store.sub.accounts.transact({
    account_id: debt_account.id,
    amount: 1000,
    memo: 'test',
  })
  await store.sub.accounts.deleteWholeAccount(debt_account.id);

  let rows;
  rows = await store.query<{num:number}>('SELECT COUNT(*) as num FROM account', {})
  t.equal(rows[0].num, 0, "should delete the account")
  rows = await store.query<{num:number}>('SELECT COUNT(*) as num FROM bucket', {})
  t.equal(rows[0].num, 0, "should delete the debt bucket")
  rows = await store.query<{num:number}>('SELECT COUNT(*) as num FROM account_transaction', {})
  t.equal(rows[0].num, 0, "should delete account transactions")
  rows = await store.query<{num:number}>('SELECT COUNT(*) as num FROM bucket_transaction', {})
  t.equal(rows[0].num, 0, "should delete bucket transactions")
})
