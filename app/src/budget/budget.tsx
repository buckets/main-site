import * as React from 'react'
import * as moment from 'moment'
import * as _ from 'lodash';
import {RPCRendererStore} from '../rpc'
import {Renderer} from './render'
import {AccountsPage} from './accounts'
import {BucketsPage, BucketStyles} from './buckets'
import {TransactionPage} from './transactions'
import {Money} from '../money'
import { MonthSelector } from '../input'
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

