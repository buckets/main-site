import { shell, ipcRenderer } from 'electron'
import * as React from 'react'
import * as moment from 'moment-timezone'
import * as _ from 'lodash'
import * as cx from 'classnames'
import { sss, localizeThisPage } from '../i18n'
import {Renderer} from './render'
import { AccountsPage, ClosedAccountsPage } from './accounts'
import { BucketsPage, BucketStyles, KickedBucketsPage } from './buckets'
import {TransactionPage} from './transactions'
import { ImportPage, SyncWidget } from './importpage'
import { ExportPage } from './exportpage'
import { SearchPage } from './searchpage'
import { SettingsPage } from './settingspage'
import { ReportsPage } from './reports'
import { Money, setAnimationEnabled } from '../money'
import { fancyEval } from 'buckets-core/dist/money'
import { MonthSelector } from '../input'
import { Router, Route, Link, Switch, Redirect, WithRouting} from './routing'
import { ToastDisplay } from './toast'
import { FinderDisplay } from './finding'
import { isRegistered, openBuyPage, promptForLicense } from '../mainprocess/drm'
import { getCurrentFile } from '../mainprocess/files'
import { Help } from '../tooltip'
import { reportErrorToUser } from '../errors';
import { ToolsPage } from './tools/toolspage'
import { PrefixLogger } from '../logging'
import { PSTATE } from '../mainprocess/persistent'
import { utcNow, localNow, setTimezone } from 'buckets-core/dist/time'

//----------------------------------------------------------
// For deprecated triplesec encryption
//----------------------------------------------------------
import * as triplesec from 'triplesec'
import { TriplesecCrypter } from 'buckets-core/dist/crypto'
TriplesecCrypter.setPackage(triplesec)
//----------------------------------------------------------

const log = new PrefixLogger('(budget.r)');
setTimezone(PSTATE.timezone || moment.tz.guess())

import { manager, AppState } from './appstate'

export function setPath(x:string) {
  if (x === null) {
    log.warn('Attempted setting path to null');
  } else {
    window.location.hash = '#' + x;
    log.info(`window.location.hash = ${window.location.hash}`);
  }
}

export async function start(base_element, room) {
  await localizeThisPage();
  log.info(`  localNow(): ${localNow().format()}`);
  log.info(`    utcNow(): ${utcNow().format()}`);
  log.info('         toString:', (new Date()).toString())
  log.info('   toLocaleString:', (new Date()).toLocaleString())
  log.info('getTimezoneOffset:', (new Date()).getTimezoneOffset())
  log.info(`moment: ${moment.version}`)
  log.info(`moment.locale: ${moment.locale()}`);

  if (!PSTATE.animation) {
    log.info('Disabling money animation');
    setAnimationEnabled(false);
  }

  // listen for uncaught exceptions
  window.addEventListener('error', (ev:ErrorEvent) => {
    log.error('Uncaught error:', ev.message);
    log.error(ev.error.stack);
    reportErrorToUser(ev.error.toString(), {
      title: 'Uncaught Error',
      err: ev.error,
    })
  }, false);

  let store = getCurrentFile().store;

  // initial state
  manager.attach(store);
  await manager.refresh();

  // watch for changes
  store.events.get('obj').on(async (data) => {
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
  ipcRenderer.on('buckets:goto', (ev, path:string) => {
    setPath(path);
  })
  ipcRenderer.on('buckets:goto-today', (ev) => {
    let current_path = window.location.hash.substr(1).split('/').slice(2).join('/');
    let today = localNow();
    let year = today.year();
    let month = today.month()+1;
    const dst = `/y${year}m${month}/${current_path}`;
    setPath(dst);
  })

  let renderer = new Renderer();
  renderer.registerRendering(() => {
    let path = window.location.hash.substr(1);
    return <Application
      path={path}
      setPath={setPath}
      appstate={manager.appstate}
      />;
  }, base_element);
  renderer.doUpdate();

  if (!window.location.hash) {
    log.info('No hash, going to #/accounts');
    window.location.hash = `#/accounts`;
  }
}

class Navbar extends React.Component<{
  appstate: AppState;
}, {
  calc_showing: boolean;
  calc_value: string;
}> {
  constructor(props) {
    super(props);
    this.state = {
      calc_showing: false,
      calc_value: '',
    }
  }
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
    
    let import_badge_count = (
      appstate.num_unknowns
      + appstate.csvs_needing_mapping.length
      + appstate.csvs_needing_account.length
    );
    let import_badge = import_badge_count ? <div className="badge">{import_badge_count}</div> : null;

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
    let lowerhalf;
    if (this.state.calc_showing) {
      lowerhalf = <div>
        <a href="#"
          className="selected"
          onClick={ev => {
            ev.preventDefault();
            this.setState({calc_showing: false});
          }}>
            <span><span className="fa fa-fw fa-close"></span> {sss('Calculator')} <Help>{sss('You can do math in all number inputs, not just here in the calculator.')}</Help></span>
          </a>
        <Calculator
          value={this.state.calc_value}
          onChange={newval => {
            this.setState({calc_value: newval});
          }}/>
      </div>
    } else {
      lowerhalf = <div>
        <a href="#" onClick={ev => {
          ev.preventDefault();
          this.setState({calc_showing: true});
        }}>
          <span><span className="fa fa-fw fa-calculator"></span> {sss('Calculator')}</span>
        </a>
        <Link relative to="/search" exactMatchClass="selected" matchClass="selected"><span><span className="fa fa-fw fa-search"></span> {sss('Search')}</span></Link>
        <Link relative to="/export" exactMatchClass="selected" matchClass="selected"><span><span className="fa fa-fw fa-download"></span> {sss('Export')}</span></Link>
        <SyncWidget appstate={appstate} />
        <a href="#" onClick={(ev) => {
          ev.preventDefault();
          shell.openExternal('https://www.budgetwithbuckets.com/chat');
          return false;
        }}><span><span className="fa fa-fw fa-comment"></span> {sss('Chat with Matt'/* If "Chat with Matt" is too wide, you can translate this as just "Chat" */)}</span></a>
        <Link relative to="/settings" exactMatchClass="selected" matchClass="selected"><span><span className="fa fa-fw fa-cog"></span> {sss('Settings')}</span></Link>
        {trial_version}
      </div> 
    }
    return (
      <div className="nav">
        <div>
          <Link relative to="/accounts" exactMatchClass="selected"><span>{sss('Accounts')}</span></Link>
          <Route path="/accounts">
            <Link relative to="/closed" className="sub" exactMatchClass="selected" matchClass="selected-parent">{sss('Closed'/*! Label for list of closed accounts */)}</Link>
          </Route>
          <Link relative to="/transactions" exactMatchClass="selected" matchClass="selected-parent"><span>{sss('Transactions')}</span>{transactions_badge}</Link>
          <Link relative to="/buckets" exactMatchClass="selected"><span>{sss('Buckets'/* Bucket list page title.  Does NOT refer to the application name */)}</span>{buckets_badge}</Link>
          <Route path="/buckets">
            <Link relative to="/kicked" className="sub" exactMatchClass="selected" matchClass="selected-parent">{sss('Kicked'/* Label for list of archived buckets */)}</Link>
          </Route>
          <Link relative to="/analysis" exactMatchClass="selected"><span>{sss('Analysis')}</span></Link>
          <Route path="/analysis">
            <div>
              <Link relative to="/recurring-expenses" className="sub" exactMatchClass="selected">{sss('Recurring Expenses')}</Link>
            </div>
          </Route>
          <Link relative to="/import" exactMatchClass="selected" matchClass="selected"><span>{sss('Import')}</span>{import_badge}</Link>
          <Link relative to="/tools" exactMatchClass="selected" matchClass="selected-parent"><span>{sss('Tools')}</span></Link>
        </div>
        {lowerhalf}
      </div>)
  }
}


class Calculator extends React.PureComponent<{value:string, onChange:(newval:string)=>void}> {
  render() {
    let output;
    try {
      output = fancyEval(this.props.value);
      if (isNaN(Number(output))) {
        output = '?'
      }
    } catch(err) {
      output = '?';
    }
    return <div className="calculator">
      <div className="result">{output}</div>
      <textarea
        autoFocus
        placeholder="1+1*3/(4+2)"
        value={this.props.value}
        onChange={ev => {
          this.props.onChange(ev.target.value);
        }}
      ></textarea>
    </div>
  }
}

interface ApplicationProps {
  path: string;
  setPath: (x:string)=>void;
  appstate: AppState;
}
class Application extends React.Component<ApplicationProps, any> {
  render() {
    let today = localNow();
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
                <div className="header">
                  <div className="totals">
                    <total>
                      <name>
                        <Help icon={<span><span className="fa fa-tint" /> {sss('Rain')}</span>}>
                          <table>
                            <tbody>
                              <tr>
                                <td>{sss('Accounts')}</td>
                                <td></td>
                                <td className="right"><Money value={appstate.open_accounts_balance} noFaintCents /></td>
                              </tr>
                              <tr>
                                <td>{sss('Buckets'/* Refers to a list of buckets, not the application title */)}</td>
                                <td>-</td>
                                <td className="right"><Money value={appstate.bucket_total_balance} noFaintCents /></td>
                              </tr>
                              <tr>
                                <td>{sss('Used in future')}</td>
                                <td>-</td>
                                <td className="right"><Money value={appstate.rain_used_in_future} noFaintCents /></td>
                              </tr>
                              <tr>
                                <td colSpan={3} className="total-line">
                                </td>
                              </tr>
                              <tr>
                                <td>{sss('Rain')}</td>
                                <td></td>
                                <td className="right"><Money value={appstate.rain} noFaintCents /></td>
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
                                    })(<Money value={Math.abs(appstate.rain)} noFaintCents />)
                                  }
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </Help>
                      </name>
                      <amount><Money value={appstate.rain} symbol /></amount>
                    </total>
                    <total className="section-start">
                      <name>{sss('Income')}</name>
                      <amount><Money value={appstate.income} symbol /></amount>
                    </total>
                    <inter-total>-</inter-total>
                    <total>
                      <name>{sss('Expenses')}</name>
                      <amount><Money className="negative" value={Math.abs(appstate.expenses)} symbol /></amount>
                    </total>
                    <inter-total>=</inter-total>
                    <total>
                      <name>{sss('months gain/loss label', (gain) => {
                        return gain >= 0 ? "Month's gain" : "Month's loss";
                      })(appstate.gain)}</name>
                      <amount><Money value={appstate.gain} symbol /></amount>
                    </total>
                    <total className="section-start">
                      <name>{sss('in the bank')}</name>
                      <amount><Money value={appstate.open_accounts_balance} symbol /></amount>
                    </total>
                  </div>
                  <div>
                    <WithRouting func={(routing) => {
                      return (<MonthSelector
                        className="big"
                        month={routing.params.month-1}
                        year={routing.params.year}
                        onChange={({month, year}) => {
                          routing.setPath(`/y${year}m${month+1}${routing.rest}`);
                        }}
                      />);
                    }} />
                  </div>
                </div>
                <div className="page">
                  <Switch>
                    <Route path="/accounts/closed">
                      <ClosedAccountsPage appstate={appstate} />
                    </Route>
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
                    <Route path="/export">
                      <ExportPage appstate={appstate} />
                    </Route>
                    <Route path="/search">
                      <SearchPage appstate={appstate} />
                    </Route>
                    <Route path="/tools">
                      <ToolsPage appstate={appstate} />
                    </Route>
                    <Route path="/settings">
                      <SettingsPage appstate={appstate} />
                    </Route>
                  </Switch>
                </div>
              </div>
            </div>
          </Route>
          <WithRouting func={(routing) => {
            log.info('today', today.format());
            log.info('appstate.month', appstate.month);
            log.info('appstate.year', appstate.year);
            let dft_path = routing.fullpath || '/accounts';
            let year = appstate.year || today.year();
            let month = appstate.month ? appstate.month : (today.month()+1);
            const dst = `/y${year}m${month}${dft_path}`;
            log.info(`Redirect to ${dst}`)
            return (<Redirect to={dst} />)
          }} />
        </Switch>
      </Router>);
  }
}

