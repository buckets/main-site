import * as React from 'react';
import * as _ from 'lodash';
import * as moment from 'moment';
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
    return renderer.doUpdate();
  })

  // routing
  window.addEventListener('hashchange', () => {
    renderer.doUpdate();
  }, false);


  let renderer = new Renderer();
  renderer.registerRendering(() => {
    let path = window.location.hash.substr(1);
    let route = getRoute(path, state, {});
    return <Application state={state} route={route} />;
  }, base_element);
  renderer.doUpdate();

  if (!window.location.hash) {
    window.location.hash = `#/accounts`;
  }
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

interface IRoute {
  params: {[k:string]:any};
  title: string;
  section: 'accounts' | 'buckets';
  header: JSX.Element;
  body: JSX.Element;
}

function getRoute(path:string, state:State, context:any):IRoute {
  context = context || {};
  let segments = path.split('/').filter(a => a);
  let seg0 = segments[0];
  let m;
  let ret:IRoute = {
    params: context,
    title: 'not found',
    section: 'accounts',
    header: <div>HEADER {window.location.href}</div>,
    body: <div>Not found</div>,
  }

  if (!)

  // Year and month prefix segment
  if (m = seg0.match(/^(\d\d\d\d)-(\d\d?)$/)) {
    context.year = parseInt(m[1]);
    context.month = parseInt(m[2]);
    segments = segments.slice(1);
    seg0 = segments[0]
  } else {
    let today = moment();
    context.year = today.year();
    context.month = today.month()+1;
  }

  switch (seg0) {
    case 'accounts': {
      if (segments.length) {
        // single account
      } else {
        // all accounts
        ret.title = 'Accounts';
        ret.section = 'accounts';
        ret.body = (<AccountsPage state={state} />);
      }
      break;
    }
  }
  return ret;
}


interface ApplicationProps {
  state: State,
  route: IRoute;
}
class Application extends React.Component<ApplicationProps, any> {
  render() {
    let state = this.props.state;
    let route = this.props.route;
    
    // routing
    let body:JSX.Element;

    let link = (title, page) => {
      let cls = page == route.page ? 'selected' : '';
      href = `#${href}`;
      return <a href={href} className={cls}>{title}</a>
    }

    body = route.body;
    console.log("route", route);
    return (<div className="app">
      <div className="nav">
        <div>
          {link('Accounts', '/accounts')}
          {link('Transactions', '/transactions')}
          {link('Buckets', '/buckets')}
          {link('Reports', '/reports')}
        </div>
        <div>
          {link('Connections', '/connections')}
        </div>
      </div>
      <div className="content">
        <div className="header">
          Header information
          {window.location.hash}
        </div>
        <div className="body">
          {body}
        </div>
      </div>
    </div>);    
  }
}
