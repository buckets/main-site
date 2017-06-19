import * as React from 'react';
import * as _ from 'lodash';
import {RPCRendererStore, isObj} from '../../core/store';
import {Renderer} from '../render';
import {Account, Balances} from '../../core/models/account';

export async function start(base_element, room) {
  let store = new RPCRendererStore(room);

  // initial state
  let state = new State();
  await Promise.all([
    store.accounts.balances()
      .then(balances => {
        state.balances.accounts = balances;
      }),
    store.accounts.list()
      .then(accounts => {
        console.log('accounts', accounts);
        accounts.forEach(account => {
          state.accounts[account.id] = account;
        })
      })
  ]);

  // watch for changes
  store.data.map((value) => {
      if (isObj(Account, value.obj)) {
        state.accounts[value.obj.id] = value.obj;
      }
    })
    .isEmpty()
    .forEach(() => {
      renderer.doUpdate();
    })

  let renderer = new Renderer();
  renderer.registerRendering(<div>
      <AccountList accounts={state.accounts} />
    </div>,
    base_element);
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
}

class AccountList extends React.Component<{accounts:{}},any> {
  render() {
    let accounts = _.values(this.props.accounts)
    .map((account:Account) => {
      return <div key={account.id}>{account.id} Account {account.name} {account.balance}</div>
    })
    return <div>
      {accounts}
    </div>
  }
}
