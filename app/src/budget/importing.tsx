import * as React from 'react'
import * as fs from 'fs-extra-promise'
import * as moment from 'moment'
import * as log from 'electron-log'
import * as _ from 'lodash'
import { sss } from '../i18n'
import { remote, ipcRenderer } from 'electron'
import { AppState, StateManager, manager } from './appstate'
import { setPath } from './budget';
import { ofx2importable } from '../ofx'
import { hashStrings } from '../models/simplefin'
import { makeToast } from './toast'

export interface ImportableTrans {
  account_label: string;
  amount:number;
  memo:string;
  posted:moment.Moment;
  fi_id?:string;
  currency?:string;
}

interface PendingImport {
  transactions: ImportableTrans[];
  account_label: string;
  hash: string;
}

export class FileImportState {
  pending_imports:PendingImport[] = [];
}

export class FileImportManager {
  constructor(public manager:StateManager) {
    ipcRenderer.on('start-file-import', () => {
      this.openFileDialog();
    })
  }
  openFileDialog() {
    remote.dialog.showOpenDialog({
      title: sss('Open Transaction File'),
      filters: [
        {name: 'OFX/QFX', extensions: ['ofx', 'qfx']},
      ],
    }, paths => {
      if (paths) {
        paths.forEach(path => {
          this.openFile(path);
        })
      }
      setPath('/import');
    })
  }
  async openFile(path) {
    let data = await fs.readFileAsync(path, {encoding:'utf8'});

    // try ofx
    let parsed:ImportableTrans[];
    try {
      parsed = await ofx2importable(data);
    } catch(err) {
      log.error(err);
      return;
    }

    if (parsed.length) {
      let account_label = parsed[0].account_label;
      let hash = hashStrings([account_label]);
      let rows = await this.manager.store.query(`SELECT account_id FROM account_mapping WHERE account_hash=$hash`, {$hash: hash});
      if (rows.length === 1) {
        // matching account
        let account_id = rows[0].account_id;
        let imported = await Promise.all(parsed.map(trans => {
          return this.manager.store.accounts.importTransaction({
            account_id,
            amount: trans.amount,
            memo: trans.memo,
            posted: trans.posted,
            fi_id: trans.fi_id,
          })
        }));
        makeToast(sss('imported X trans', (trans_count:number) => {
          return `Imported ${trans_count} transactions.`;
        })(imported.length));
      } else {
        // no matching account
        this.manager.appstate.fileimport.pending_imports.push({
          transactions: parsed,
          account_label,
          hash,
        })
        this.manager.emit('change');
      }
    }
  }
  async finishImport(pending:PendingImport, str_account_id:string) {
    let account_id:number;
    if (str_account_id === 'NEW') {
      let new_account = await this.manager.store.accounts.add(pending.account_label)
      account_id = new_account.id;
      await manager.store.connections.linkAccountToHash(pending.hash, new_account.id);
      makeToast(sss('Account created:') + ' ' + new_account.name);
    } else {
      account_id = parseInt(str_account_id);
      await manager.store.connections.linkAccountToHash(pending.hash, account_id);
      makeToast(sss('Account linked'));
    }
    let imported = await Promise.all(pending.transactions.map(trans => {
      return manager.store.accounts.importTransaction({
        account_id,
        amount: trans.amount,
        memo: trans.memo,
        posted: trans.posted,
        fi_id: trans.fi_id,
      })
    }));
    makeToast(sss('imported n trans', (num_trans:number) => {
      return `Imported ${num_trans} transactions.`;
    })(imported.length));
    let pending_imports = this.manager.appstate.fileimport.pending_imports;
    pending_imports.splice(pending_imports.indexOf(pending), 1);
    this.manager.emit('change');
  }
}

class UnlinkedAccountRow extends React.Component<{
  pending: PendingImport;
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
    let { pending, accounts } = this.props;
    let options = accounts.map(account => {
      return <option key={account.id} value={account.id}>{account.name}</option>
    })
    return <tr>
      <td>{pending.account_label}</td>
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
    manager.fileimport.finishImport(this.props.pending, this.state.chosen_account_id);
  }
}

interface PageProps {
  appstate: AppState;
}
export class TransactionImportPage extends React.Component<PageProps, {}> {
  render() {
    let { appstate } = this.props;
    let accounts = _.values(appstate.accounts);
    let pending_import_table;
    if (appstate.fileimport.pending_imports.length) {
      let rows = appstate.fileimport.pending_imports.map((pending, idx) => {
        return <UnlinkedAccountRow
          key={idx}
          pending={pending}
          accounts={accounts} />
      })
      pending_import_table = <table className="ledger">
        <thead>
          <tr>
            <th>{sss('Name')}</th>
            <th>{sss('Account')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    }
    return (
      <div className="rows">
        <div className="subheader">
          <div className="group">
            <button onClick={() => {
              manager.fileimport.openFileDialog();
            }}>{sss('Import transaction file')}</button>
            <button onClick={() => {
              setPath('/connections');
            }}>{sss('Connect to bank')}</button>
          </div>
        </div>
        <div className="panes">
          <div className="padded">
            {pending_import_table}
          </div>
        </div>
      </div>
    )
  }
}