import * as React from 'react';
import * as _ from 'lodash';
import * as moment from 'moment';
import {EventEmitter} from 'events';
import {RPCRendererStore, isObj, ObjectEvent, IStore} from '../../core/store';
import {Renderer} from '../render';
import {Account, Balances} from '../../core/models/account';
import {AccountsPage} from './accounts';
import {Router, Route, Link, Switch, Redirect, CurrentPath, WithRouting} from './routing';

export async function start(base_element, room) {
  let store = new RPCRendererStore(room);

  // initial state
  let state = new State(store);
  await state.refresh();

  // watch for changes
  store.data.on('obj', async (data) => {
    console.log('processEvent', data);
    state.processEvent(data);
    return renderer.doUpdate();
  })
  state.on('change', () => {
    renderer.doUpdate();
  })

  // routing
  window.addEventListener('hashchange', () => {
    renderer.doUpdate();
  }, false);
  let setPath = (x:string) => {
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


export class State extends EventEmitter {
  public accounts: {
    [k:number]: Account,
  } = {};
  public balances: {
    accounts: Balances;
  } = {
    accounts: {},
  }
  public month:number;
  public year:number;

  constructor(public store:IStore) {
    super()
  }
  async processEvent(ev:ObjectEvent):Promise<any> {
    let obj = ev.obj;
    if (isObj(Account, obj)) {
      this.accounts = _.cloneDeep(this.accounts);
      if (ev.event === 'update') {
        this.accounts[obj.id] = obj;
        await this.fetchAccountBalances();
      } else if (ev.event === 'delete') {
        delete this.accounts[obj.id];
      }
    }
  }
  setDate(year:number, month:number) {
    console.log(`State.setDate(${year}, ${month})`);
    if (this.year !== year || this.month !== month) {
      this.year = year;
      this.month = month;  
      this.refresh();
    }
  }
  refresh():Promise<any> {
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
    let nextmonth = moment(`${this.year}-${this.month}-1`, 'YYYY-MM-DD')
      .add(1, 'month')
      .utc()
      .format('YYYY-MM-DD HH:mm:ss')
    return this.store.accounts.balances(nextmonth)
      .then(balances => {
        this.balances.accounts = balances;
        this.emit('change', null);
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
    let today = moment();
    let state = this.props.state;
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
            <WithRouting func={({params}) => {
              this.props.state.setDate(params.year, params.month);
              return null;
            }} />
            <div className="app">
              <div className="nav">
                <div>
                  <Link relative to="/accounts" exactMatchClass="selected" matchClass="selected-parent">Accounts</Link>
                  <Link relative to="/transactions" exactMatchClass="selected" matchClass="selected-parent">Transactions</Link>
                  <Link relative to="/buckets" exactMatchClass="selected" matchClass="selected-parent">Buckets</Link>
                  <Route path="/buckets">
                    <Link relative to="/kicked" className="sub" exactMatchClass="selected" matchClass="selected-parent">Kicked</Link>
                  </Route>
                  <Link relative to="/reports" exactMatchClass="selected" matchClass="selected-parent">Reports</Link>
                </div>
                <div>
                </div>
              </div>
              <div className="content">
                <div className="header">
                  <div></div>
                  <div>
                    <WithRouting func={(routing) => {
                      return (<MonthSelector
                        month={routing.params.month}
                        year={routing.params.year}
                        onChange={(year, month) => {
                          routing.setPath(`/y${year}m${month}${routing.rest}`);
                        }}
                      />);
                    }} />
                  </div>
                </div>
                <div className="body">
                  <Route path="/accounts">
                    <AccountsPage state={state} />
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
          <Redirect to={`/y${today.year()}m${today.month()+1}`} />
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
  private minyear = 1900;
  constructor(props) {
    super(props)
    this.state = {
      year: props.year,
      month: props.month,
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      year: nextProps.year,
      month: nextProps.month,
    })
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
      return year >= this.minyear;
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