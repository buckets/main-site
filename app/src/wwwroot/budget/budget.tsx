import * as React from 'react';
import * as _ from 'lodash';
import {RPCRendererStore, isObj, ObjectEvent, IStore} from '../../core/store';
import {Renderer} from '../render';
import {Account, Balances} from '../../core/models/account';
import {AccountsPage} from './accounts';

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

  // routing
  window.addEventListener('hashchange', () => {
    renderer.doUpdate();
  }, false);


  let renderer = new Renderer();
  renderer.registerRendering(() => {
    let path = (window.location.hash || '#/accounts').substr(1);
    return <Application state={state} url={path} />;
  }, base_element);
  store.createObject(Account, {name: 'Checking'})
}


export class State {
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

  constructor(public store:IStore) {

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

interface ApplicationProps {
  state: State,
  url: string;
}
class Application extends React.Component<ApplicationProps, any> {
  render() {
    let state = this.props.state;
    let segments = this.props.url.split('/').filter(a => a);
    let link = (name, href) => {
      let cls = href == this.props.url ? 'selected' : '';
      href = `#${href}`;
      return <a href={href} className={cls}>{name}</a>
    }
    // routing
    let body:JSX.Element;
    switch (segments[0]) {
      case 'accounts': {
        body = <AccountsPage state={state} />
        break;
      }
      default: {
        body = <div>404</div>;
      }
    }
    return (<div className="app">
      <div className="nav">
        <div>
          {link('Accounts', '/accounts')}
          {link('Transactions', '/transactions')}
          {link('Buckets', '/buckets')}
          {link('Connections', '/connections')}
          {link('Reports', '/reports')}
        </div>
      </div>
      <div className="content">
        <div className="header">
          Header information
        </div>
        <div className="body">
          {body}
        </div>
      </div>
    </div>);    
  }
}
