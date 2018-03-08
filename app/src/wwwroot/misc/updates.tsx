import * as React from 'react'
import { ipcRenderer, remote } from 'electron'
import { documentDimensions } from '../../position'

import { sss, localizeThisPage } from '../../i18n'
import { Renderer } from '../../budget/render'
import { IUpdateStatus, CURRENT_UPDATE_STATUS } from '../../mainprocess/updater'

let STATUS:IUpdateStatus = CURRENT_UPDATE_STATUS;
let renderer:Renderer = new Renderer();
let current_window = remote.getCurrentWindow();
fitToContent();

export async function start(base_element) {
  localizeThisPage();

  renderer.registerRendering(() => {
    return <UpdateApp status={STATUS} />
  }, base_element);
  renderer.doUpdate();
  
  ipcRenderer.on('buckets:update-status', (ev, data) => {
    STATUS = data;
    renderer.doUpdate();
  })
}

function fitToContent(width?:number) {
  setTimeout(() => {
    let dims = documentDimensions();
    const height = dims.h > 350 ? 350 : dims.h;
    if (!width) {
      width = dims.w > 600 ? 600 : dims.w;
    }
    current_window.setContentSize(width, height);
  }, 0);
}

class UpdateApp extends React.Component<{status:IUpdateStatus}, any> {
  render() {
    let { current_version, error, new_version, state, percent, releaseNotes } = this.props.status;
    let guts;
    let error_el = error ? <div className="error">{sss('There was an error.  Maybe try again?')}</div> : null;
    
    if (state === 'idle' || !state) {
      guts = <div className="buttons">
        <button onClick={() => {
          ipcRenderer.send('buckets:check-for-updates');
        }}>{sss('Check for Updates')}</button>
      </div>
    } else if (state === 'checking') {
      guts = <div>
        {sss('Checking for updates...')} <span className="fa fa-refresh fa-spin" />
      </div>
    } else if (state === 'update-available') {
      guts = <div>
        <div>{sss('version-available', (newv:string) => `Version ${newv} available.`)(new_version)}</div>
        <div className="buttons">
          <button onClick={() => {
            ipcRenderer.send('buckets:skip-version', new_version);
          }}>{sss('Skip This Version')}</button>
          <button onClick={() => {
            ipcRenderer.send('buckets:download-update');
          }}>{sss('Download Update')}</button>
        </div>
        <div className="release-notes" dangerouslySetInnerHTML={{__html: releaseNotes}}></div>
      </div>
      fitToContent(600);
    } else if (state === 'not-available') {
      guts = sss("You are running the latest version!");
    } else if (state === 'downloading') {
      guts = <div>
        {sss('Downloading update...')} <span className="fa fa-refresh fa-spin" />
        <div>
          <div className="progress-bar">
            <div className="bar" style={{
              width: `${percent}%`,
            }}/>
          </div>
        </div>
        <div className="release-notes" dangerouslySetInnerHTML={{__html: releaseNotes}}></div>
      </div>
    } else if (state === 'downloaded') {
      guts = <div>
        <div>{sss('Update downloaded.')}</div>
        <div className="button">
          <button onClick={() => {
            ipcRenderer.send('buckets:install-update');    
          }}>{sss('Install and Relaunch Buckets')}</button>
        </div>
        <div className="release-notes" dangerouslySetInnerHTML={{__html: releaseNotes}}></div>
      </div>
    }
    return <div className="update-app padded">
      <div className="title">Buckets {current_version}</div>
      {error_el}
      {guts}
    </div>
  }
}
