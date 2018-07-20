import * as React from 'react'
import * as cx from 'classnames'
import { shell } from 'electron'
import { makeToast } from './toast'
import { Account, UnknownAccount } from 'buckets-core/dist/models/account'
import { Connection } from 'buckets-core/dist/models/simplefin'
import { BankMacro } from 'buckets-core/dist/models/bankmacro'
import { manager, AppState } from './appstate'
import { DateTime } from '../time'
import { sss } from '../i18n'
import { ClickToEdit, SafetySwitch } from '../input'
import { getCurrentFile } from '../mainprocess/files'
import { Help } from '../tooltip'
import { setPath } from './budget'
import { CSVMapper, CSVAssigner } from '../csvimport'

function syncCurrentMonth(appstate:AppState) {
  let range = appstate.viewDateRange;
  return getCurrentFile().startSync(range.onOrAfter, range.before)
}


export class SyncWidget extends React.Component<{
  appstate: AppState;
}, {}> {
  render() {
    let label = sss('Sync');
    let { appstate } = this.props;
    let { syncing } = appstate;
    if (syncing) {
      label = sss('Syncing...');
    }
    return <div className="sync-widget">
      <a
        href="#"
        onClick={async ev => {
          ev.preventDefault();
          if (syncing) {
            makeToast(sss('A sync is already in progress'), {className: 'warning'})
          } else {
            if (appstate.canSync()) {
              try {
                await syncCurrentMonth(appstate);  
              } catch(err) {
                makeToast(sss('Error running sync'), {className: 'error'});
              }  
            } else {
              // nothing to sync
              setPath('/import');
              makeToast(sss('Sync has not yet been set up.'), {className: 'warning'})
            }
          }
          return false;
        }}>
        <span>
          <span
            className={cx("fa fa-refresh fa-fw", {
              'fa-spin': syncing,
            })}/> {label}
        </span>
      </a>
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

    let macros;
    if (Object.keys(appstate.bank_macros).length) {
      macros = <div>
        <h2>{sss('Macros')}</h2>
        <BankMacroList
          macros={Object.values(appstate.bank_macros)}
          running_bank_macros={appstate.running_bank_macros}
        />
      </div>
    }

    let conns;
    if (Object.keys(appstate.sfinconnections).length) {
      conns = <div>
        <h2>{sss('SimpleFIN Connections')}</h2>
        <ConnectionList connections={Object.values(appstate.sfinconnections)} />
      </div>
    }

    let csvmappers;
    if (appstate.csvs_needing_mapping.length) {
      csvmappers = <div>
        <h2>{sss('CSV Fields')}</h2>
        {appstate.csvs_needing_mapping.map(csv => {
          return <CSVMapper key={csv.id} obj={csv} />
        })}
      </div>
    }

    let csvassigners;
    if (appstate.csvs_needing_account.length) {
      csvassigners = <div>
        <h2>{sss('CSV Account')}</h2>
        {appstate.csvs_needing_account.map(csv => {
          return <CSVAssigner
            key={csv.id}
            accounts={appstate.open_accounts}
            obj={csv} />
        })}
      </div>
    }

    return (
      <div className="rows">
        <div className="subheader">
          <div>
            <button
              onClick={() => {
                if (appstate.syncing) {
                  getCurrentFile().cancelSync();
                } else {
                  syncCurrentMonth(appstate);
                }
              }}
              disabled={!appstate.canSync()}><span className={cx("fa fa-refresh", {
                'fa-spin': appstate.syncing,
              })}/> {appstate.syncing ? sss('Cancel sync') : sss('Sync')}</button>
            <button onClick={() => {
                getCurrentFile().openImportFileDialog();
              }}>
                <span className="fa fa-upload"></span> Import file
              </button>
          </div>
          <div>
            <button onClick={() => { makeToast(`Here are ${Math.ceil(1 + Math.random() * 1000)} pieces of ${'t'.repeat(Math.ceil(30*Math.random()))}toast`)}}>{sss('Test Toast')}</button>
          </div>
        </div>
        <div className="padded section">
          
          {csvassigners}
          {csvmappers}
          <div className="connection-steps">{steps}</div>
          {unknown}
          {conns}
          {macros}

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
                onClick={this.createMacro}>{sss('Create macro')}</button>

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
                <li><i className="fa-li fa fa-close" /> Not all banks supported</li>
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
                getCurrentFile().openImportFileDialog();
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
                Download files from your bank and import them into Buckets by hand.
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
  createMacro = async () => {
    let macro = await manager
    .checkpoint(sss('Create Macro'))
    .sub.bankmacro.add({name: ''});
    manager.nocheckpoint.ui.openBankMacroBrowser(macro.id);
  }
  connect = async () => {
    try {
      await manager.nocheckpoint.sub.simplefin.consumeToken(this.state.simplefin_token)
    } catch(err) {
      this.setState({status_message: err.toString()});
      return;
    }
    this.setState({
      status_message: '',
      connecting: false,
    })
    makeToast(sss('Connection saved!'));
    return syncCurrentMonth(this.props.appstate);
  }
}


class BankMacroList extends React.Component<{
  macros: BankMacro[];
  running_bank_macros: Set<number>;
}, {}> {
  render() {
    let { running_bank_macros } = this.props;
    return <table className="ledger">
      <thead>
        <tr>
          <th><Help icon={sss('On')}>{sss('When "On" this macro will be run during a normal sync.')}</Help></th>
          <th>{sss('Name')}</th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {this.props.macros.map((macro, idx) => {
          let play_button;
          if (running_bank_macros.has(macro.id)) {
            // macro is currently running
            play_button = <button className="icon">
              <span className="fa fa-refresh fa-spin"/>
            </button>
          } else {
            // macro is currently not running
            play_button = <button className="icon"
              onClick={() => {
                let { onOrAfter, before } = manager.appstate.viewDateRange;
                manager.nocheckpoint.sub.bankmacro.runMacro(macro.id, onOrAfter, before);
              }}><span className="fa fa-play"></span></button>
          }
          return <tr key={idx}>
            <td className="center">
              <input
                type="checkbox"
                checked={macro.enabled}
                onChange={(ev) => {
                  const enabled = (ev.target as any).checked;
                  manager
                  .checkpoint(enabled ? sss('Enable Macro') : sss('Disable Macro'))
                  .sub.bankmacro.update(macro.id, {enabled});
                }}
              />
            </td>
            <td>
              <ClickToEdit
                value={macro.name}
                placeholder="no name"
                onChange={(val) => {
                  manager
                  .checkpoint(sss('Update Macro Name'))
                  .sub.bankmacro.update(macro.id, {name: val});
                }}
              />
            </td>
            <td className="icon-button-wrap">
              <button className="icon"
                onClick={() => {
                  manager
                  .nocheckpoint.ui.openBankMacroBrowser(macro.id);
                }}>
                <span className="fa fa-gear"></span>
              </button>
            </td>
            <td className="icon-button-wrap">
              {play_button}
            </td>
            <td className="icon-button-wrap">
              <SafetySwitch
                className="icon"
                coverClassName="white"
                onClick={(ev) => {
                  manager
                  .checkpoint(sss('Delete Macro'))
                  .sub.bankmacro.delete(macro.id);
                }}><span className="fa fa-trash"></span></SafetySwitch>
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
        <td className="icon-button-wrap">
          <SafetySwitch
            className="icon"
            coverClassName="white"
            onClick={(ev) => {
              manager
              .checkpoint(sss('Delete Connection'))
              .deleteObject('simplefin_connection', conn.id);
            }}
          >
            <span className="fa fa-trash"></span>
          </SafetySwitch>
        </td>
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
    let store = manager.checkpoint(sss('Link Account'))
    let { unknown } = this.props;
    let account_id = this.state.chosen_account_id;
    let numeric_account_id:number;
    if (account_id === 'NEW') {
      // Make a new account
      let new_account = await store.sub.accounts.add(unknown.description);
      numeric_account_id = new_account.id;
    } else {
      // Link to an existing account
      numeric_account_id = parseInt(account_id);
    }
    await store.sub.accounts.linkAccountToHash(unknown.account_hash, numeric_account_id);
  }
}