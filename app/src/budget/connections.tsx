import * as React from 'react'
import * as _ from 'lodash'
import { shell } from 'electron'
import { makeToast } from './toast'
import { Connection } from '../models/simplefin'
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
    return (
      <div className="rows">
        <div className="subheader">
          <button onClick={this.startConnecting}>Connect to bank</button>
          <button onClick={() => { makeToast('Here is some toast')}}>Toast</button>
        </div>
        <div className="padded">
          <div className="connection-steps">{steps}</div>
          <ConnectionList connections={_.values(appstate.connections)} />
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
    console.log('connect', this.state);
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
    makeToast('Connected!');
    console.log('connection', connection);
  }
}


class ConnectionList extends React.Component<{
  connections: Connection[]
}, {}> {
  render() {
    let rows = this.props.connections.map(conn => {
      return <tr>
        <td>{conn.id}</td>
        <td><DateTime value={conn.last_used} /></td>
      </tr>
    })
    return <table className="ledger">
      <thead>
        <tr>
          <th>ID</th>
          <th>Last used</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  }
}