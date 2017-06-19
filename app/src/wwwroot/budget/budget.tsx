import * as React from 'react';
import * as _ from 'lodash';
import {RPCRendererStore, isObj} from '../../core/store';
import {Renderer} from '../render';
import {Account} from '../../core/models/account';

export async function start(base_element, room) {
  let store = new RPCRendererStore(room);
  store.data.map((value) => {
      if (isObj(Account, value.obj)) {
        accounts[value.obj.id] = value.obj;
      }
    })
    .isEmpty()
    .forEach(() => {
      renderer.doUpdate();
    })
  let accounts:{
    [k:number]: Account,
  } = {};
  let renderer = new Renderer();
  renderer.registerRendering(<div>
      <AccountList accounts={accounts} />
    </div>,
    base_element);
  store.createObject(Account, {name: 'Checking'})
}

class AccountList extends React.Component<{accounts:{}},any> {
  render() {
    let accounts = _.values(this.props.accounts)
    .map((account:Account) => {
      return <div key={account.id}>Account {account.name} {account.balance}</div>
    })
    return <div>
      {accounts}
    </div>
  }
}