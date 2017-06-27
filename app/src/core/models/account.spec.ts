import {DBStore, ObjectEvent, isObj} from '../store';
import {Account, Transaction} from './account';
import {expect} from 'chai';
import 'mocha';

let store:DBStore;
let events:Array<ObjectEvent>;
beforeEach(async () => {
  store = new DBStore(':memory:');
  await store.open();
  events = [];
  store.data.on('obj', message => {
    events.push(message as ObjectEvent);
  })
})

describe('add account', () => {
  let ev:ObjectEvent;
  beforeEach(async () => {
    await store.accounts.add('Checking');
    ev = events[0];
  })
  it('event', () => {
    expect(ev.event).to.eq('update');
  });
  it('obj', () => {
    let obj = ev.obj as Account;
    expect(isObj(Account, ev.obj)).to.eq(true);
    expect(obj.id).not.to.eq(null);
    expect(obj.created).not.to.eq(null);
    expect(obj._type).to.eq('account');
    expect(obj.name).to.eq('Checking');
    expect(obj.balance).to.eq(0);
    expect(obj.currency).to.eq('USD');
  })
  it('stored in database', async () => {
    let obj = await store.getObject(Account, ev.obj.id);
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
    expect(isObj(Transaction, tevent.obj)).to.eq(true);
    let t = <Transaction>tevent.obj;
    expect(t.amount).to.eq(800);
    expect(t.memo).to.eq('something important');
    expect(t.account_id).to.eq(account.id);
  })
  it('should emit the new account', () => {
    let aevent = events[1];
    expect(aevent.event).to.eq('update');
    expect(isObj(Account, aevent.obj)).to.eq(true);
    let a = <Account>aevent.obj;
    expect(a.balance).to.eq(800);
  })

  describe('listTransactions', () => {
    
  })

  describe('balances', () => {
    let bal_before;
    let bal_after;
    beforeEach(async () => {
      bal_before = await store.accounts.balances('2000-01-01 00:00:00');
      bal_after = await store.accounts.balances();
    })

    it('balance before transaction', () => {
      expect(bal_before[account.id]).to.eq(0);
    })
    it('balance after transaction', () => {
      expect(bal_after[account.id]).to.eq(800);
    })
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
      expect(isObj(Transaction, tevent.obj)).to.eq(true);
      let t = <Transaction>tevent.obj;
      expect(t.id).to.eq(trans.id);
      expect(t.amount).to.eq(800);
      expect(t.memo).to.eq('something important');
      expect(t.account_id).to.eq(account.id);
    })
    it('should emit the new account', () => {
      let aevent = events[1];
      expect(aevent.event).to.eq('update');
      expect(isObj(Account, aevent.obj)).to.eq(true);
      let a = <Account>aevent.obj;
      expect(a.balance).to.eq(0);
    })
  })
})