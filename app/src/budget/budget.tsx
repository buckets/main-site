import * as React from 'react'
import * as moment from 'moment'
import * as _ from 'lodash';
import {RPCRendererStore} from '../rpc'
import {Renderer} from './render'
import {AccountsPage} from './accounts'
import {BucketsPage, BucketStyles} from './buckets'
import {TransactionPage} from './transactions'
import { ConnectionsPage } from './connections'
import {Money} from '../money'
import { MonthSelector } from '../input'
import {Router, Route, Link, Switch, Redirect, WithRouting} from './routing'
import { ToastDisplay } from './toast'

import { manager, AppState } from './appstate'

export function setPath(x:string) {
  window.location.hash = '#' + x;
}

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

class Navbar extends React.Component<{}, {}> {
  render() {
    return (
      <div className="nav">
        <Link relative to="/accounts" exactMatchClass="selected" matchClass="selected-parent">Accounts</Link>
        <Link relative to="/transactions" exactMatchClass="selected" matchClass="selected-parent">Transactions</Link>
        <Link relative to="/buckets" exactMatchClass="selected" matchClass="selected-parent">Buckets</Link>
        <Route path="/buckets">
          <Link relative to="/kicked" className="sub" exactMatchClass="selected" matchClass="selected-parent">Kicked</Link>
        </Route>
        <Link relative to="/reports" exactMatchClass="selected" matchClass="selected-parent">Reports</Link>
        <Link relative to="/connections" exactMatchClass="selected" matchClass="selected">Connections</Link>
      </div>)
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
        <ToastDisplay />
        <Switch>
          <Route path="/y<int:year>m<int:month>">
            <WithRouting func={({params}) => {
              manager.setDate(params.year, params.month);
              return null;
            }} />
            <div className="app">
              <Navbar />
              <div className="content">
                <header>
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
                        className="big"
                        month={routing.params.month}
                        year={routing.params.year}
                        onChange={(year, month) => {
                          routing.setPath(`/y${year}m${month}${routing.rest}`);
                        }}
                      />);
                    }} />
                  </div>
                </header>
                <div className="page">
                  <Route path="/accounts">
                    <AccountsPage appstate={appstate} />
                  </Route>
                  <Route path="/buckets">
                    <BucketsPage appstate={appstate} />
                  </Route>
                  <Route path="/transactions">
                    <TransactionPage appstate={appstate} />
                  </Route>
                  <Route path="/connections">
                    <ConnectionsPage appstate={appstate} />
                  </Route>
                </div>
              </div>
            </div>
          </Route>
          <WithRouting func={(routing) => {
            let dft_path = routing.fullpath || '/accounts';
            let year = appstate.year || today.year();
            let month = appstate.month || today.month()+1
            return (<Redirect to={`/y${year}m${month}${dft_path}`} />)
          }} />
        </Switch>
      </Router>);
  }
}

