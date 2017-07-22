import * as React from 'react'
import * as fs from 'fs-extra-promise'
import { remote } from 'electron'
import { AppState, StateManager, manager } from './appstate'
import { setPath } from './budget';
import { parse as parseOFX } from 'ofx-js';

export class FileImportState {

}

export class FileImportManager {
  constructor(public manager:StateManager) {
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
    })
  }
  async openFile(path) {
    console.log('opening file', path);
    let data = await fs.readFileAsync(path, {encoding:'utf8'});
    console.log(data);

    // try ofx
    let parsed = await parseOFX(data);
    console.log('parsed', parsed);
    
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