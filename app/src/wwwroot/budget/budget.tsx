import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {RPCRendererStore} from '../../core/store';

import {Account} from '../../core/models/account';

export async function start(base_element, room) {
  let store = new RPCRendererStore(room);
  ReactDOM.render(<div>hello</div>, base_element);
  store.createObject(Account, {name: 'Checking'})
}