import * as React from 'react';
import * as _ from 'lodash';
import * as moment from 'moment';
import {RPCRendererStore, isObj, ObjectEvent, IStore} from '../../core/store';
import {Renderer} from '../render';
import {Account, Balances} from '../../core/models/account';
// import {AccountsPage} from './accounts';
import {Router, Route, Link, Switch, Redirect, CurrentPath, WithRouting} from './routing';

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
    console.log('hashchange');
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
                  <Route path="/buckets">
                    <Link relative to="/kicked" className="sub" classWhenActive="selected">Kicked</Link>
                  </Route>
                  <Link relative to="/reports" classWhenActive="selected">Reports</Link>
                </div>
                <div>
                </div>
              </div>
              <div className="content">
                <div className="header">
                  <WithRouting func={(routing) => {
                    return (<MonthSelector
                      month={routing.params.month}
                      year={routing.params.year}
                      onChange={(year, month) => {
                        console.log('onChange', year, month);
                        console.log(routing);
                        routing.setPath(`/y${year}m${month}${routing.rest}`);
                      }}
                    />);
                  }} />
                </div>
                <div className="body">
                  <Route path="/accounts">
                    You are on /accounts
                  </Route>
                  <Route path="/buckets">
                    You are on /buckets
                    <Custom>
                      <div>
                        <WithRouting func={(routing) => {
                          return (<div>fullpath: {routing.fullpath}</div>);
                        }} />
                      </div>
                    </Custom>
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
  onChange: (year, month)=>void;
}
export class MonthSelector extends React.Component<MonthSelectorProps, any> {
  private minyear = 1984;
  private maxyear = moment().year() + 1;
  constructor(props) {
    super(props)
    this.state = {
      year: props.year,
      month: props.month,
    }
  }
  componentWillReceiveProps(nextProps) {
    console.log('new props');
  }
  render() {
    let months = moment.monthsShort();
    let current_month = this.state.month - 1;
    let options = months.map((name, idx) => {
      return <option key={idx} value={idx}>{name.toUpperCase()}</option>
    })
    let cls = `month-selector bg-${this.state.month}`;
    return (<div className={cls}>
      <button onClick={this.increment(-1)}>&#x25c0;</button>
      <select
        className={`month color-${this.state.month}`}
        value={current_month}
        onChange={this.monthChanged}>
        {options}
      </select>
      <input
        className="year"
        type="text"
        size={4}
        value={this.state.year}
        onChange={this.yearChanged} />
      <button onClick={this.increment(1)}>&#x25b6;</button>
    </div>);
  }
  increment(amount) {
    return (ev) => {
      let month = this.state.month + amount;
      month--; // move to 0-based indexing
      let year = this.state.year;
      while (month < 0) {
        month = 12 + month;
        if (!isNaN(year)) {
          year -= 1;  
        }
      }
      while (month >= 12) {
        month = month - 12;
        if (!isNaN(year)) {
          year += 1;
        }
      }
      month++; // return to 1-based indexing
      this.setDate(year, month);
    }
  }
  isValidYear(year):boolean {
    if (isNaN(year)) {
      return false;
    } else {
      return year >= this.minyear && year <= this.maxyear;
    }
  }
  monthChanged = (ev) => {
    let new_month = parseInt(ev.target.value) + 1;
    this.setDate(this.state.year, new_month);
  }
  yearChanged = (ev) => {
    let new_year = parseInt(ev.target.value);
    this.setDate(new_year, this.state.month);
  }
  setDate(year:number, month:number) {
    let newstate:any = {year, month};
    if (isNaN(year)) {
      newstate = {year:'', month};
      this.setState(newstate);
      return;
    }
    if (this.isValidYear(year)) {
      this.props.onChange(year, month);
    }
    this.setState(newstate);
  }
}


class Custom extends React.Component<any, any> {
  render() {
    return <div>{this.props.children}</div>
  }
}