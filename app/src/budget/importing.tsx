import * as React from 'react'
import * as log from 'electron-log'
import { FileImport } from '../importing'
import { sss } from '../i18n'
import { remote, ipcRenderer } from 'electron'
import { AppState, StateManager, manager } from './appstate'
import { setPath } from './budget';
import { makeToast } from './toast'


export class FileImportState {
  pending_imports:FileImport[] = [];
}

export class FileImportManager {
  constructor(public manager:StateManager) {
    ipcRenderer.on('buckets:start-file-import', () => {
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
          this.doImport(path);
        })
        setPath('/import');
      }
    })
  }
  async doImport(path:string):Promise<FileImport> {
    let imp = new FileImport(this.manager.store, path);
    await imp.run();

    if (imp.error) {
      log.error(imp.error);
      makeToast(sss('Error importing file:') + imp.error)
    } else if (imp.pending) {
      // prepare for finishing
      imp.events.account_created.on(account => {
        makeToast(sss('Account created:') + ' ' + account.name);
      })
      imp.events.account_linked.on(() => {
        makeToast(sss('Account linked'));
      })
      imp.events.imported.on(transactions => {
        makeToast(sss('imported n trans', (num_trans:number) => {
          return `Imported ${num_trans} transactions.`;
        })(transactions.length));
        
        // remove it from the pending list
        let pending_imports = this.manager.appstate.fileimport.pending_imports;
        pending_imports.splice(pending_imports.indexOf(imp), 1);
        this.manager.events.change.emit(this.manager.appstate);
      })

      this.manager.appstate.fileimport.pending_imports.push(imp)
      this.manager.events.change.emit(this.manager.appstate);
    } else {
      makeToast(sss('imported X trans', (trans_count:number) => {
        return `Imported ${trans_count} transactions.`;
      })(imp.imported.length));
    }
    return imp;
  }
}

class UnlinkedAccountRow extends React.Component<{
  pending: FileImport;
  accounts: Account[];
}, {
  chosen_account_id: number|'NEW';
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
      <td>{pending.pending.account_label}</td>
      <td>
        <select
          value={this.state.chosen_account_id}
          onChange={(ev) => {
            this.setState({chosen_account_id: ev.target.value as (number|'NEW')})
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
    this.props.pending.finish(this.state.chosen_account_id);
  }
}

interface PageProps {
  appstate: AppState;
}
export class TransactionImportPage extends React.Component<PageProps, {}> {
  render() {
    let { appstate } = this.props;
    let accounts = Object.values(appstate.accounts);
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