import * as React from 'react'
import * as _ from 'lodash'
import { shell } from 'electron'
import { makeToast, makeToastDuring } from './toast'
import { Connection, UnknownAccount } from '../models/simplefin'
import { manager, AppState } from './appstate'
import { DateTime } from '../time'

export class ConnectionsPage extends React.Component<{
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
          Connecting to your bank account will make it easy to pull transaction history
          from your bank into Buckets.  To connect, do the following:
        </div>
        <ol>
          <li>
            Get a SimpleFIN Token from the <a href="#" onClick={(ev) => {
              ev.preventDefault();
              shell.openExternal("https://bridge.simplefin.org");
            }}>SimpleFIN Bridge</a>
          </li>
          <li>
            Then paste your SimpleFIN Token here:
            <div><textarea
              onChange={(ev) => {
                this.setState({
                  simplefin_token: ev.target.value,
                  status_message: 'Connecting...',
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
        <h2>Unlinked Accounts</h2>
        <UnlinkedAccountList appstate={appstate} />
      </div>
    }

    let conns;
    if (Object.keys(appstate.connections).length) {
      conns = <div>
        <h2>Connections</h2>
        <ConnectionList connections={_.values(appstate.connections)} />
      </div>
    }

    return (
      <div className="rows">
        <div className="subheader">
          <div>
            <button onClick={this.syncTransactions} disabled={!conns}><span className="fa fa-refresh"/> Sync</button>
            <button onClick={this.startConnecting}>Connect to bank</button>
          </div>
          <div>
            <button onClick={() => { makeToast('Here is some toast')}}>Test Toast</button>
          </div>
        </div>
        <div className="padded">
          <div className="connection-steps">{steps}</div>
          {unknown}
          {conns}
        </div>
      </div>
    )
  }
  startConnecting = () => {
    this.setState({
      connecting: true,
    })
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
    makeToast('Connection saved!');
    return this.syncTransactions();
  }
  syncTransactions = async () => {
    await makeToastDuring('Syncing...', () => {
      return manager.store.connections.sync();
    }, 'Sync complete!')
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
        }}>Delete</button></td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>ID</th>
          <th>Last used</th>
          <th></th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  }
}


class UnlinkedAccountList extends React.Component<{
  appstate: AppState,
}, {}> {
  render() {
    let { appstate } = this.props;
    let rows = _.values(appstate.unknown_accounts)
    .map(acc => {
      return <UnlinkedAccountRow
        key={acc.id}
        unknown={acc}
        accounts={_.values(appstate.accounts)} />
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>Description</th>
          <th>Account</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  }
}

class UnlinkedAccountRow extends React.Component<{
  unknown: UnknownAccount;
  accounts: Account[];
}, {
  chosen_account_id: string;
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
          <option value="NEW">+ Create new account</option>
          {options}
        </select>
      </td>
      <td>
        <button onClick={this.link}>Link</button>
      </td>
    </tr>
  }
  link = async () => {
    let str_account_id = this.state.chosen_account_id;
    if (str_account_id === 'NEW') {
      let new_account = await manager.store.accounts.add(this.props.unknown.description)
      await manager.store.connections.linkAccountToHash(this.props.unknown.account_hash, new_account.id);
      makeToast(`Account created: ${new_account.name}`)
    } else {
      let account_id = parseInt(str_account_id);
      await manager.store.connections.linkAccountToHash(this.props.unknown.account_hash, account_id);
      makeToast('Account linked');
    }
    
  }
}