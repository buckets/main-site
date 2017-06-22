import * as React from 'react';
import * as _ from 'lodash';
// import * as moment from 'moment';
import {RPCRendererStore, isObj, ObjectEvent, IStore} from '../../core/store';
import {Renderer} from '../render';
import {Account, Balances} from '../../core/models/account';
// import {AccountsPage} from './accounts';
import {Router, Route, Link, Switch, Redirect, CurrentPath} from './routing';

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
    return <Application
      path={path}
      setPath={setPath}
      state={state} />;
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



interface ApplicationProps {
  path: string,
  setPath: (x:string)=>void;
  state: State,
}
class Application extends React.Component<ApplicationProps, any> {
  render() {
    return (
      <Router
        path={this.props.path}
        setPath={this.props.setPath}
        >
        <div style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
        }}>Current path: <CurrentPath /></div>
        <Switch>
          <Route path="/y<int:year>m<int:month>">
            <div className="app">
              <div className="nav">
                <div>
                  <Link relative to="/accounts" classWhenActive="selected">Accounts</Link>
                  <Link relative to="/transactions" classWhenActive="selected">Transactions</Link>
                  <Link relative to="/buckets" classWhenActive="selected">Buckets</Link>
                  <Link relative to="/reports" classWhenActive="selected">Reports</Link>
                </div>
                <div>
                </div>
              </div>
              <div className="content">
                <div className="header">
                  Header information
                  {window.location.hash}
                  <WithParams component={MonthSelector} year=/>
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
          <Redirect to="/y2000m1" />
        </Switch>
      </Router>);
  }
}

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year:number, month:number):void;
}
class MonthSelector extends React.Component<MonthSelectorProps, any> {
  render() {
    return <div>Year: {this.props.year} Month: {this.props.month}</div>;
  }
}
