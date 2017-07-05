import * as React from 'react'
import * as moment from 'moment'
import * as _ from 'lodash';
import {RPCRendererStore} from '../rpc'
import {Renderer} from './render'
import {AccountsPage} from './accounts'
import {BucketsPage, BucketStyles} from './buckets'
import {TransactionPage} from './transactions'
import {Money} from '../money'
import {Router, Route, Link, Switch, Redirect, CurrentPath, WithRouting} from './routing'

import { manager, AppState } from './appstate'

export async function start(base_element, room) {
  let store = new RPCRendererStore(room);

  // initial state
  manager.setStore(store);
  await manager.refresh();

  // watch for changes
  store.data.on('obj', async (data) => {
    manager.processEvent(data);
    return renderer.doUpdate();
  })
  manager.on('change', () => {
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
    console.log('RENDERING');
    let path = window.location.hash.substr(1);
    return <Application
      path={path}
      setPath={setPath}
      appstate={manager.appstate}
      />;
  }, base_element);
  renderer.doUpdate();

  if (!window.location.hash) {
    window.location.hash = `#/accounts`;
  }
}

interface ApplicationProps {
  path: string;
  setPath: (x:string)=>void;
  appstate: AppState;
}
class Application extends React.Component<ApplicationProps, any> {
  render() {
    let today = moment();
    let { appstate } = this.props;
    return (
      <Router
        path={this.props.path}
        setPath={this.props.setPath}
        >
        <BucketStyles buckets={_.values(appstate.buckets)} />
        <div style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
        }}>Current path: <CurrentPath /></div>
        <Switch>
          <Route path="/y<int:year>m<int:month>">
            <WithRouting func={({params}) => {
              manager.setDate(params.year, params.month);
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
                  <div className="totals">
                    <total>
                      <name>Rain</name>
                      <amount>💧<Money value={appstate.rain} /></amount>
                    </total>
                    <total className="section-start">
                      <name>Income</name>
                      <amount><Money value={appstate.income} /></amount>
                    </total>
                    <inter-total>-</inter-total>
                    <total>
                      <name>Expenses</name>
                      <amount><Money className="negative" value={Math.abs(appstate.expenses)} /></amount>
                    </total>
                    <inter-total>=</inter-total>
                    <total>
                      <name>Month's {appstate.gain >= 0 ? 'Gain' : 'Loss'}</name>
                      <amount><Money value={appstate.gain} /></amount>
                    </total>
                  </div>
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
                    <AccountsPage appstate={appstate} />
                  </Route>
                  <Route path="/buckets">
                    <BucketsPage appstate={appstate} />
                  </Route>
                  <Route path="/transactions">
                    <TransactionPage appstate={appstate} />
                  </Route>
                </div>
              </div>
            </div>
          </Route>
          <WithRouting func={(routing) => {
            let dft_path = routing.fullpath || '/accounts';
            return (<Redirect to={`/y${today.year()}m${today.month()+1}${dft_path}`} />)
          }} />
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
