import * as React from 'react';
import * as _ from 'lodash';
import {RPCRendererStore, isObj, ObjectEvent, IStore} from '../../core/store';
import {Renderer} from '../render';
import {Account, Balances} from '../../core/models/account';

export async function start(base_element, room) {
  let store = new RPCRendererStore(room);

  // initial state
  let state = new State(store);
  await state.start();

  // watch for changes
  store.data.on('obj', async (data) => {
    state.processEvent(data);
    await state.flush()
    console.log('RENDERING');
    return renderer.doUpdate();
  })

  let renderer = new Renderer();
  renderer.registerRendering(() => {
    return (<div>
      <AccountList accounts={state.accounts} />
    </div>);
  }, base_element);
  store.createObject(Account, {name: 'Checking'})
}


class State {
  public accounts: {
    [k:number]: Account,
  } = {};
  public balances: {
    accounts: Balances;
  } = {
    accounts: {},
  }
  public current_date: string = null;
  private _fetch_account_balances: boolean = false;

  constructor(private store:IStore) {

  }

  processEvent(ev:ObjectEvent) {
    console.log('processing event', ev);
    let obj = ev.obj;
    if (isObj(Account, obj)) {
      this.accounts = _.cloneDeep(this.accounts);
      if (ev.event === 'update') {
        console.log('adding to this.accounts');
        this.accounts[obj.id] = obj;
        this._fetch_account_balances = true;
      } else if (ev.event === 'delete') {
        delete this.accounts[obj.id];
      }
    }
  }

  private scheduled = [];
  schedule(func:()=>any) {
    this.scheduled.push(func);
  }
  async flush():Promise<any> {
    // fetch balances
    if (this._fetch_account_balances) {
      this._fetch_account_balances = false;
      this.schedule(this.fetchAccountBalances.bind(this))
    }

    // run scheduled events
    let scheduled = this.scheduled.slice();
    this.scheduled.length = 0;
    return Promise.all([
      ...scheduled.map(func => func()),
    ]);
  }

  start():Promise<any> {
    return Promise.all([
      this.fetchAllAccounts(),
      this.fetchAccountBalances(),
    ])
  }

  fetchAllAccounts() {
    return this.store.accounts.list()
      .then(accounts => {
        accounts.forEach(account => {
          this.accounts[account.id] = account;
        })
      })
  }
  fetchAccountBalances() {
    return this.store.accounts.balances()
      .then(balances => {
        this.balances.accounts = balances;
      })
  }
}

class AccountList extends React.Component<{accounts:{}},any> {
  render() {
    console.log('AccountList render', JSON.stringify(this.props.accounts));
    let accounts = _.values(this.props.accounts)
    .map((account:Account) => {
      return <div key={account.id}>{account.id} Account {account.name} {account.balance}</div>
    })
    return <div>
      {accounts}
    </div>
  }
}
