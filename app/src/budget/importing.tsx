import * as React from 'react'
import * as fs from 'fs-extra-promise'
import * as moment from 'moment'
import { remote, ipcRenderer } from 'electron'
import { AppState, StateManager, manager } from './appstate'
import { setPath } from './budget';
import { ofx2importable } from '../ofx'

export interface ImportableTrans {
  account_label: string;
  amount:number;
  memo:string;
  posted:moment.Moment;
  fi_id?:string;
  currency?:string;
}

export class FileImportState {

}

export class FileImportManager {
  constructor(public manager:StateManager) {
    ipcRenderer.on('start-file-import', () => {
      this.openFileDialog();
    })
  }
  openFileDialog() {
    console.log('openFileDialog');
    remote.dialog.showOpenDialog({
      title: 'Open Transaction File',
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
    console.log('opening file', path);
    let data = await fs.readFileAsync(path, {encoding:'utf8'});

    // try ofx
    let parsed = await ofx2importable(data);
    console.log('parsed', parsed);

    // Matt, now add the parsed data to FileImportState in such a
    // way that you can match up the account and add it.
    // Perhaps UnknownAccount needs to have a 'From Connections' or
    // 'From File Import' designation.
    
    // let parsed = await parseOFX(data);
    // console.log('parsed', parsed);
    
  }
}

interface PageProps {
  appstate: AppState;
}
export class TransactionImportPage extends React.Component<PageProps, {}> {
  render() {
    return (
      <div className="rows">
        <div className="subheader">
          <div className="group">
            <button onClick={() => {
              manager.fileimport.openFileDialog();
            }}>Open Transaction File</button>
            <button onClick={() => {
              setPath('/connections');
            }}>Connect to bank</button>
          </div>
        </div>
        <div className="panes">
          <div className="padded">
            contents!
          </div>
        </div>
      </div>
    )
  }
}