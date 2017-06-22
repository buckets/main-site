import * as React from 'react';
import * as _ from 'lodash';
import * as moment from 'moment';
import {RPCRendererStore, isObj, ObjectEvent, IStore} from '../../core/store';
import {Renderer} from '../render';
import {Account, Balances} from '../../core/models/account';
import {AccountsPage} from './accounts';
import {Router, Route, Link, WithRouting} from './routing';

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
  let setPath = (x:string) => {
    console.log(`setPath("${x}")`)
    window.location.hash = '#' + x;
  }


  let renderer = new Renderer();
  renderer.registerRendering(() => {
    let path = window.location.hash.substr(1);
    return <Application path={path} setPath={setPath} state={state} />;
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

export function getRoute(path:string, state:State, context:any):IRoute {
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
  path: string,
  setPath: (x:string)=>void;
  state: State,
}
class Application extends React.Component<ApplicationProps, any> {
  render() {
    return (
      <Router path={this.props.path} setPath={this.props.setPath}>
        <Route path="/<int:year>-<int:month>">
          <div className="app">
            <div className="nav">
              <div>
                <Link to="/accounts">Accounts</Link>
                <Link to="/transactions">Transactions</Link>
              </div>
              <div>
              </div>
            </div>
            <div className="content">
              <div className="header">
                Header information
                {window.location.hash}
              </div>
              <div className="body">
                <Route path="/accounts">
                  You are on /accounts
                </Route>
                <Route path="/transactions">
                  You are on /transactions
                </Route>
              </div>
            </div>
          </div>
        </Route>
        <Route path="/a">
          /a
          <Route path="/c">
            /c
          </Route>
          <Route path="/d" exact>
            /d
          </Route>
          <ul>
            <li><Link relative to="/c">/c</Link></li>
            <li><Link relative to="/d">/d</Link></li>
            <li><Link relative to="/..">../</Link></li>
          </ul>
        </Route>
        <Route path="/b">
          /b
        </Route>
        <Route path="/i<int:number>">
          /i:number
          <WithRouting component={Debug}/>
          <Route path="/name" exact>
            <WithRouting component={Debug}/>
          </Route>
          <ul>
            <li><Link relative to="/name">/name</Link></li>
          </ul>
        </Route>
        <ul>
          <li><Link to="/a">/a</Link></li>
          <li><Link to="/a/c">/a/c</Link></li>
          <li><Link to="/a/d">/a/d</Link></li>
          <li><Link to="/b">/b</Link></li>
          <li><Link to="/i5">/i5</Link></li>
          <li><Link to="/i8">/i8</Link></li>
        </ul>
      </Router>);
  }
}

class Debug extends React.Component<{foo:string}, any> {
  render() {
    return <pre>DEBUG {JSON.stringify(this.props, null, 2)}</pre>
  }
}