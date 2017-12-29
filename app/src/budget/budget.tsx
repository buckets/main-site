import { shell, ipcRenderer } from 'electron'
import * as log from 'electron-log'
import * as React from 'react'
import * as moment from 'moment'
import * as _ from 'lodash'
import * as cx from 'classnames'
import { sss } from '../i18n'
import {Renderer} from './render'
import {AccountsPage} from './accounts'
import { BucketsPage, BucketStyles, KickedBucketsPage } from './buckets'
import {TransactionPage} from './transactions'
import { ImportPage, SyncWidget } from './importpage'
import { ReportsPage } from './reports'
import {Money} from '../money'
import { MonthSelector } from '../input'
import {Router, Route, Link, Switch, Redirect, WithRouting} from './routing'
import { ToastDisplay } from './toast'
import { FinderDisplay } from './finding'
import { isRegistered, openBuyPage, promptForLicense } from '../mainprocess/drm'
import { current_file } from '../mainprocess/files'
import { Help } from '../tooltip'
import { reportErrorToUser } from '../errors';

import { manager, AppState } from './appstate'

export function setPath(x:string) {
  window.location.hash = '#' + x;
}

export async function start(base_element, room) {
  // listen for uncaught exceptions
  window.addEventListener('error', (ev:ErrorEvent) => {
    log.error('Uncaught error:', ev.message);
    log.error(ev.error.stack);
    reportErrorToUser(ev.error.toString(), {
      title: 'Uncaught Error',
      err: ev.error,
    })
  }, false);

  let store = current_file.store;

  // initial state
  manager.attach(store, current_file);
  await manager.refresh();

  // watch for changes
  store.bus.obj.on(async (data) => {
    await manager.processEvent(data);
  })
  manager.events.change.on(() => {
    renderer.doUpdate();
  })

  // watch for find commands
  FinderDisplay.start();

  // routing
  window.addEventListener('hashchange', () => {
    renderer.doUpdate();
  }, false);

  // watch for the main process to tell me where to go
  ipcRenderer.on('buckets:goto', (path:string) => {
    setPath(path);
  })

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

class Navbar extends React.Component<{
  appstate: AppState;
}, {}> {
  render() {
    let { appstate } = this.props;
    let trial_version = (
      <a
        className="trial-version"
        onClick={() => {
          openBuyPage();
          promptForLicense();
        }}>{sss('Trial Version')}
      </a>
    )
    if (isRegistered()) {
      trial_version = null;
    }
    let import_badge;
    if (appstate.num_unknowns) {
      import_badge = <div className="badge">{appstate.num_unknowns}</div>
    }
    let transactions_badge;
    if (appstate.num_uncategorized_trans) {
      transactions_badge = <div className="badge">{appstate.num_uncategorized_trans}</div>
    }
    let buckets_badge;
    if (!appstate.num_uncategorized_trans && appstate.rain) {
      let cls = cx('badge', {
        'red': appstate.rain < 0,
      })
      buckets_badge = <div className={cls}><span className="fa fa-tint"/></div>
    }
    return (
      <div className="nav">
        <div>
          <Link relative to="/accounts" exactMatchClass="selected" matchClass="selected-parent"><span>{sss('Accounts')}</span></Link>
          <Link relative to="/transactions" exactMatchClass="selected" matchClass="selected-parent"><span>{sss('Transactions')}</span>{transactions_badge}</Link>
          <Link relative to="/buckets" exactMatchClass="selected"><span>{sss('Buckets')}</span>{buckets_badge}</Link>
          <Route path="/buckets">
            <Link relative to="/kicked" className="sub" exactMatchClass="selected" matchClass="selected-parent">{sss('Kicked')}</Link>
          </Route>
          <Link relative to="/analysis" exactMatchClass="selected"><span>{sss('Analysis')}</span></Link>
          <Route path="/analysis">
            <div>
              <Link relative to="/recurring-expenses" className="sub" exactMatchClass="selected">{sss('Recurring Expenses')}</Link>
            </div>
          </Route>
          <Link relative to="/import" exactMatchClass="selected" matchClass="selected"><span>{sss('Import')}</span>{import_badge}</Link>
        </div>
        <div>
          <SyncWidget appstate={appstate} />
          <a href="#" onClick={(ev) => {
            ev.preventDefault();
            shell.openExternal('https://www.budgetwithbuckets.com/chat');
            return false;
          }}><span><span className="fa fa-fw fa-comment"></span> {sss('Chat with Matt')}</span></a>
          {trial_version}
        </div>
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
        <FinderDisplay />
        <Switch>
          <Route path="/y<int:year>m<int:month>">
            <WithRouting func={({params}) => {
              manager.setDate(params.year, params.month);
              return null;
            }} />
            <div className="app">
              <Navbar appstate={appstate} />
              <div className="content">
                <header>
                  <div className="totals">
                    <total>
                      <name>
                        <Help icon={<span><span className="fa fa-tint" /> {sss('Rain')}</span>}>
                          <table>
                            <tr>
                              <td>{sss('Accounts')}</td>
                              <td></td>
                              <td className="right"><Money value={appstate.account_total_balance} /></td>
                            </tr>
                            <tr>
                              <td>{sss('Buckets')}</td>
                              <td>-</td>
                              <td className="right"><Money value={appstate.bucket_total_balance} /></td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="total-line">
                              </td>
                            </tr>
                            <tr>
                              <td>{sss('Rain')}</td>
                              <td></td>
                              <td className="right"><Money value={appstate.rain} /></td>
                            </tr>
                            <tr>
                              <td colSpan={3}>
                                {appstate.rain >= 0
                                  ? sss('rain.help.pos', (abs_amount:JSX.Element) => {
                                    return <span>
                                    You have {abs_amount} left to put into buckets.
                                    </span>
                                  })(<Money value={Math.abs(appstate.rain)} />)
                                  : sss('rain.help.neg', (abs_amount:JSX.Element) => {
                                    return <span>
                                    You have put {abs_amount} too much money into buckets.  If all transactions have been categorized this month, remove {abs_amount} from buckets of your choosing.
                                    </span>
                                  })(<Money value={Math.abs(appstate.rain)} />)
                                }
                              </td>
                            </tr>
                          </table>
                        </Help>
                      </name>
                      <amount><Money value={appstate.rain} /></amount>
                    </total>
                    <total className="section-start">
                      <name>{sss('Income')}</name>
                      <amount><Money value={appstate.income} /></amount>
                    </total>
                    <inter-total>-</inter-total>
                    <total>
                      <name>{sss('Expenses')}</name>
                      <amount><Money className="negative" value={Math.abs(appstate.expenses)} /></amount>
                    </total>
                    <inter-total>=</inter-total>
                    <total>
                      <name>{sss('months gain/loss label', (gain) => {
                        return gain >= 0 ? "Month's gain" : "Month's loss";
                      })(appstate.gain)}</name>
                      <amount><Money value={appstate.gain} /></amount>
                    </total>
                    <total className="section-start">
                      <name>{sss('in the bank')}</name>
                      <amount><Money value={appstate.account_total_balance} /></amount>
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
                  <Switch>
                    <Route path="/accounts">
                      <AccountsPage appstate={appstate} />
                    </Route>
                    <Route path="/buckets/kicked">
                      <KickedBucketsPage appstate={appstate} />
                    </Route>
                    <Route path="/buckets">
                      <BucketsPage appstate={appstate} />
                    </Route>
                    <Route path="/transactions">
                      <TransactionPage appstate={appstate} />
                    </Route>
                    <Route path="/analysis">
                      <ReportsPage appstate={appstate} />
                    </Route>
                    <Route path="/import">
                      <ImportPage appstate={appstate} />
                    </Route>
                  </Switch>
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

