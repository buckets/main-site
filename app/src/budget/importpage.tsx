import * as React from 'react'
import * as cx from 'classnames'
import * as moment from 'moment'
import { shell } from 'electron'
import { makeToast } from './toast'
import { Account, UnknownAccount } from '../models/account'
import { Connection } from '../models/simplefin'
import { BankRecording } from '../models/bankrecording'
import { manager, AppState } from './appstate'
import { DateTime } from '../time'
import { sss } from '../i18n'
import { DebouncedInput, Confirmer } from '../input'
import { current_file } from '../mainprocess/files'

function startDefaultSync(appstate:AppState) {
  let range = appstate.viewDateRange;
  let since = range.onOrAfter.clone();
  let enddate = range.before.clone();
  manager.store.connections.syncer.start(since, enddate);
}


export class SyncWidget extends React.Component<{
  appstate: AppState;
}, {}> {
  render() {
    let label = sss('Sync');
    let { appstate } = this.props;
    let { syncing, sync_message } = appstate;
    let details;
    if (syncing) {
      label = sss('Syncing...');
      if (sync_message) {
        details = <div className="details">
          {sync_message}
        </div>
      }
    }
    return <div className="sync-widget">
      <a
        href="#"
        onClick={ev => {
          ev.preventDefault();
          startDefaultSync(appstate);
          return false;
        }}>
        <span>
          <span
            className={cx("fa fa-refresh fa-fw", {
              'fa-spin': syncing,
            })}/> {label}
        </span>
      </a>
      {details}
    </div>
  }
}

export class ImportPage extends React.Component<{
  appstate: AppState;
}, {
  connecting: boolean;
  status_message: string;
  simplefin_token: string;
}> {
  constructor(props) {
    super(props);
    this.state = {
      connecting: false,
      status_message: '',
      simplefin_token: '',
    }
  }
  render() {
    let { appstate } = this.props;
    let steps;
    if (this.state.connecting) {
      steps = (<div className="dialog">
        <div>
          {sss('simplefin-connect-intro', "To connect, do the following:")}
        </div>
        <ol>
          <li>
            {sss('simplefin-get-token', (mklink) => {
              return <span>Get a SimpleFIN Token from the {mklink('SimpleFIN Bridge')}</span>
            })((linktext:string) => {
              return <a href="#" onClick={(ev) => {
                ev.preventDefault();
                shell.openExternal("https://bridge.simplefin.org");
              }}>{linktext}</a>
            })}
          </li>
          <li>
            {sss('simplefin-paste', 'Then paste your SimpleFIN Token here:')}
            <div><textarea
              onChange={(ev) => {
                this.setState({
                  simplefin_token: ev.target.value,
                  status_message: sss('Connecting...'),
                }, () => {
                  this.connect();
                })
              }}
              value={this.state.simplefin_token}
              className="simplefin-token"></textarea></div>
          </li>
        </ol>
        <div>{this.state.status_message}</div>
      </div>)
    }
    let unknown;
    if (Object.keys(appstate.unknown_accounts).length) {
      unknown = <div>
        <h2>{sss('Unlinked Accounts')}</h2>
        <UnknownAccountList appstate={appstate} />
      </div>
    }

    let recordings;
    if (Object.keys(appstate.bankrecordings).length) {
      recordings = <div>
        <h2>{sss('Macros')}</h2>
        <BankRecordingList
          recordings={Object.values(appstate.bankrecordings)}
        />
      </div>
    }

    let conns;
    if (Object.keys(appstate.connections).length) {
      conns = <div>
        <h2>{sss('Connections')}</h2>
        <ConnectionList connections={Object.values(appstate.connections)} />
      </div>
    }

    return (
      <div className="rows">
        <div className="subheader">
          <div>
            <button
              onClick={() => {
                if (appstate.syncing) {
                  manager.store.connections.syncer.stop();
                } else {
                  startDefaultSync(appstate);
                }
              }}
              disabled={!conns}><span className={cx("fa fa-refresh", {
                'fa-spin': appstate.syncing,
              })}/> {appstate.syncing ? sss('Cancel sync') : sss('Sync')}</button>
            <button onClick={() => {
                current_file.openImportFileDialog();
              }}>
                <span className="fa fa-upload"></span> Import file
              </button>
          </div>
          <div>
            <button onClick={() => { makeToast('Here is some toast')}}>{sss('Test Toast')}</button>
          </div>
        </div>
        <div className="padded section">
          
          <div className="connection-steps">{steps}</div>
          {unknown}
          {conns}
          {recordings}

        </div>
        <div className="padded">
          <p>
            Buckets supports these methods for getting transaction data from your bank:
          </p>
          <div className="horiz-options">
            <div className="option">
              <h3>Macro <span className="experimental">Experimental</span></h3>
              
              <button
                className="primary"
                onClick={this.makeNewRecording}>{sss('Create macro')}</button>

              <ul className="fa-ul procon">
                <li><i className="fa-li fa fa-check" /> Private</li>
                <li><i className="fa-li fa fa-check" /> Free</li>
                <li><i className="fa-li fa fa-check" /> One-click sync</li>
                <li><i className="fa-li fa fa-check" /> Fast</li>
                <li><i className="fa-li fa fa-close" /> Requires some work</li>
                <li><i className="fa-li fa fa-check" /> Works with (theoretically) any bank</li>
              </ul>

              <p>
                Create a local macro to download transaction data directly from your bank.
              </p>

              <p>
                Your username and password/PIN are encrypted and stored in this budget file and only ever sent to your bank.
              </p>

            </div>
            <div className="option">
              <h3>SimpleFIN</h3>
              
              <button
                className="primary"
                onClick={this.startSimpleFINConnection}>{sss('Connect')}</button>

              <ul className="fa-ul procon">
                <li><i className="fa-li fa fa-question" /> Maybe private</li>
                <li><i className="fa-li fa fa-question" /> Maybe free</li>
                <li><i className="fa-li fa fa-check" /> One-click sync</li>
                <li><i className="fa-li fa fa-check" /> Fast</li>
                <li><i className="fa-li fa fa-check" /> Least amount of work</li>
                <li><i className="fa-li fa fa-close" /> Works with U.S. banks</li>
              </ul>

              <p>
                This method connects to a SimpleFIN server to get transaction data.
              </p>

              <p>
                If your bank supports SimpleFIN, <b>this option is the best option</b> since it will likely be free and you won't have to give your credentials to anyone (including Buckets).
              </p>
              
              <p>
                Otherwise you may use a third party, which may not be free or private.
              </p>

            </div>
            <div className="option">
              <h3>File import</h3>

              <button className="primary" onClick={() => {
                current_file.openImportFileDialog();
              }}>
                <span className="fa fa-upload"></span> Import file
              </button>
              
              <ul className="fa-ul procon">
                <li><i className="fa-li fa fa-check" /> Private</li>
                <li><i className="fa-li fa fa-check" /> Free</li>
                <li><i className="fa-li fa fa-close" /> Slow</li>
                <li><i className="fa-li fa fa-close" /> Requires the most work</li>
                <li><i className="fa-li fa fa-check" /> Works with (theoretically) any bank</li>
              </ul>

              <p>
                For this method, you download OFX/QFX files from your bank and import them into Buckets.
              </p>

              <p>
                If you only have one bank account, this might be your best option if macros are too complicated.
              </p>

            </div>
          </div>
        </div>
      </div>
    )
  }
  startSimpleFINConnection = () => {
    this.setState({
      connecting: true,
    })
  }
  makeNewRecording = async () => {
    let recording = await manager.store.bankrecording.add({name: sss('new macro')});
    current_file.openRecordWindow(recording.id);
  }
  connect = async () => {
    let connection;
    try {
      connection = await manager.store.connections.consumeToken(this.state.simplefin_token)
    } catch(err) {
      this.setState({status_message: err.toString()});
      return;
    }
    this.setState({
      status_message: '',
      connecting: false,
    })
    makeToast(sss('Connection saved!'));
    return startDefaultSync(this.props.appstate);
  }
}


class BankRecordingList extends React.Component<{
  recordings: BankRecording[];
}, {}> {
  render() {
    return <table className="ledger">
      <thead>
        <tr>
          <th>{sss('ID')}</th>
          <th>{sss('Name')}</th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {this.props.recordings.map(recording => {
          return <tr>
            <td>{recording.id}</td>
            <td>
              <DebouncedInput
                blendin
                value={recording.name}
                placeholder="no name"
                onChange={(val) => {
                  manager.store.bankrecording.update(recording.id, {name: val});
                }}
              />
            </td>
            <td>
              <button className="icon"
                onClick={() => {
                  current_file.openRecordWindow(recording.id);
                }}>
                <span className="fa fa-gear"></span>
              </button>
            </td>
            <td>
              <button className="icon"
                onClick={() => {
                  current_file.openRecordWindow(recording.id, {
                    onOrAfter: moment().startOf('month'),
                    before: moment().endOf('month'),
                  })
                }}><span className="fa fa-play"></span></button>
            </td>
            <td>
              <Confirmer
                first={<button className="icon"><span className="fa fa-trash"></span></button>}
                second={<button className="delete" onClick={(ev) => {
                  manager.store.bankrecording.delete(recording.id);
                }}>{sss('Confirm delete?')}</button>}
              />
            </td>
          </tr>
        })}
      </tbody>
    </table>
  }
}


class ConnectionList extends React.Component<{
  connections: Connection[]
}, {}> {
  render() {
    let rows = this.props.connections.map(conn => {
      return <tr key={conn.id}>
        <td>{conn.id}</td>
        <td><DateTime value={conn.last_used} /></td>
        <td><button className="delete" onClick={() => {
          manager.store.deleteObject(Connection, conn.id);
        }}>{sss('Delete')}</button></td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>{sss('ID')}</th>
          <th>{sss('Last used')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  }
}


class UnknownAccountList extends React.Component<{
  appstate: AppState,
}, {}> {
  render() {
    let { appstate } = this.props;
    let accounts = Object.values<Account>(appstate.accounts);
    let rows = Object.values<UnknownAccount>(appstate.unknown_accounts)
    .map((unknown:UnknownAccount) => {
      return <UnknownAccountRow
        key={unknown.id}
        unknown={unknown}
        accounts={accounts} />
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>{sss('Description')}</th>
          <th>{sss('Account')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  }
}

class UnknownAccountRow extends React.Component<{
  unknown: UnknownAccount;
  accounts: Account[];
}, {
  chosen_account_id: string|'NEW';
}> {
  constructor(props) {
    super(props);
    this.state = {
      chosen_account_id: 'NEW',
    }
  }
  render() {
    let { unknown, accounts } = this.props;
    let options = accounts.map(account => {
      return <option key={account.id} value={account.id}>{account.name}</option>
    })
    return <tr>
      <td>{unknown.description}</td>
      <td>
        <select
          value={this.state.chosen_account_id}
          onChange={(ev) => {
            this.setState({chosen_account_id: ev.target.value})
          }}>
          <option value="NEW">+ {sss('Create new account')}</option>
          {options}
        </select>
      </td>
      <td>
        <button onClick={this.link}>{sss('action.link-account', 'Link')}</button>
      </td>
    </tr>
  }
  link = async () => {
    let { unknown } = this.props;
    let account_id = this.state.chosen_account_id;
    let numeric_account_id:number;
    if (account_id === 'NEW') {
      // Make a new account
      let new_account = await manager.store.accounts.add(unknown.description);
      numeric_account_id = new_account.id;
    } else {
      // Link to an existing account
      numeric_account_id = parseInt(account_id);
    }
    await manager.store.accounts.linkAccountToHash(unknown.account_hash, numeric_account_id);
  }
}