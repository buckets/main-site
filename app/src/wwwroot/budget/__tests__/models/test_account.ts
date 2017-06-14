import {Store, DataEvent} from '../../store';
import {Account, isAccount, Transaction, isTransaction} from '../../models/account';
import {expect} from 'chai';
import 'mocha';

let store:Store;
let events:Array<DataEvent>;
beforeEach(async () => {
  store = new Store(':memory:');
  await store.open();
  events = [];
  store.data.subscribe(message => {
    events.push(message as DataEvent);
  })
})

describe('add account', () => {
  let ev:DataEvent;
  beforeEach(async () => {
    await store.accounts.add('Checking');
    ev = events[0];
  })
  it('event', () => {
    expect(ev.event).to.eq('update');
  });
  it('obj', () => {
    let obj = ev.obj as Account;
    expect(isAccount(ev.obj)).to.eq(true);
    expect(obj.id).not.to.eq(null);
    expect(obj._type).to.eq('account');
    expect(obj.name).to.eq('Checking');
    expect(obj.balance).to.eq(0);
    expect(obj.currency).to.eq('USD');
  })
  it('stored in database', async () => {
    let obj = <Account> await store.getObject('account', ev.obj.id);
    expect(obj.id).to.eq(ev.obj.id);
    expect(obj._type).to.eq('account');
    expect(obj.name).to.eq('Checking');
  })
})

describe('transact', () => {
  let account;
  let trans;
  beforeEach(async () => {
    account = await store.accounts.add('Checking');
    events.length = 0;
    trans = await store.accounts.transact(account.id, 800, 'something important');
  })
  it('2 events', () => {
    expect(events.length).to.eq(2);
  });
  it('should emit the new transaction', () => {
    let tevent = events[0];
    expect(tevent.event).to.eq('update');
    expect(isTransaction(tevent.obj)).to.eq(true);
    let t = <Transaction>tevent.obj;
    expect(t.amount).to.eq(800);
    expect(t.memo).to.eq('something important');
    expect(t.account_id).to.eq(account.id);
  })
  it('should emit the new account', () => {
    let aevent = events[1];
    expect(aevent.event).to.eq('update');
    expect(isAccount(aevent.obj)).to.eq(true);
    let a = <Account>aevent.obj;
    expect(a.balance).to.eq(800);
  })

  describe('delete transaction', () => {
    beforeEach(async () => {
      events.length = 0;
      await store.accounts.deleteTransactions([trans.id]);
    })
    it('2 events', () => {
      expect(events.length).to.eq(2);
    })
    it('should emit the deleted transaction', () => {
      let tevent = events[0];
      expect(tevent.event).to.eq('delete');
      expect(isTransaction(tevent.obj)).to.eq(true);
      let t = <Transaction>tevent.obj;
      expect(t.id).to.eq(trans.id);
      expect(t.amount).to.eq(800);
      expect(t.memo).to.eq('something important');
      expect(t.account_id).to.eq(account.id);
    })
    it('should emit the new account', () => {
      let aevent = events[1];
      expect(aevent.event).to.eq('update');
      expect(isAccount(aevent.obj)).to.eq(true);
      let a = <Account>aevent.obj;
      expect(a.balance).to.eq(0);
    })
  })
})