import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Store} from './store';
export async function start(base_element, dbfilename) {
  let store = await (new Store(dbfilename)).open();
  ReactDOM.render(<div>hello</div>, base_element);
  console.log('store', store);
}