import * as React from 'react'
import * as cx from 'classnames'
import { SerializedTimestamp, ensureLocalMoment, localNow, loadTS } from '../../time'
import { remote, ipcRenderer } from 'electron'
import { isObj, IStore } from '../../store'
import { BankMacro } from '../../models/bankmacro'
import { current_file } from '../../mainprocess/files'
import { IS_DEBUG } from '../../mainprocess/globals'
import { Renderer } from '../../budget/render'
import { RecordingDirector, Recording, ChangeStep, TabRecStep, TimeoutError } from '../../recordlib'
import { sss } from '../../i18n'
import { SafetySwitch } from '../../input'
import { IncorrectPassword } from '../../error'
import { makeToast, ToastDisplay } from '../../budget/toast'
import { PrefixLogger } from '../../logging'
import { Help } from '../../tooltip'
import { SyncResult } from '../../sync'

const log = new PrefixLogger('(record)')


interface WebviewProps {
  onWebview?: (x:Electron.WebviewTag)=>void;
  preload?: string;
  partition?: string;
}
class Webview extends React.Component<WebviewProps, any> {
  private elem:Electron.WebviewTag;
  shouldComponentUpdate() {
    return false;
  }
  componentDidMount() {
    this.props.onWebview && this.props.onWebview(this.elem);
  }
  render() {
    let { preload, partition } = this.props;
    return <webview ref={elem => {
      if (elem) {
        this.elem = elem as Electron.WebviewTag;
      }
    }}
      autosize
      preload={preload}
      partition={partition} />
  }
}

interface BrowserProps {
  preload?: string;
  partition?: string;
  onWebview?: (x:Electron.WebviewTag)=>void;
  onURLChange?: (url:string)=>void;
}
class Browser extends React.Component<BrowserProps, {
  url: string;
}> {
  private webview:Electron.WebviewTag;
  constructor(props) {
    super(props);
    this.state = {
      url: '',
    }
  }
  render() {
    let { preload, partition } = this.props;
    let { url } = this.state;
    return (
      <div className="browser">
        <div className="browser-topbar">
          <button onClick={() => {this.webview.goBack()}}>
            <span className="fa fa-chevron-left"></span>
          </button>
          <button onClick={() => {this.webview.goForward()}}>
            <span className="fa fa-chevron-right"></span>
          </button>
          <input
            value={url}
            onChange={ev => {
              this.setState({url: ev.target.value});
            }}
            type="text"
            placeholder="https://www.example.com/"
            onKeyDown={ev => {
              if (ev.key === 'Enter') {
                this.navigateToURL(this.state.url);
              }
            }}
          />
          <button onClick={() => {this.webview.reload()}}>
            <span className="fa fa-refresh"></span>
          </button>
          <button onClick={() => {this.navigateToURL(this.state.url)}}><span className="fa fa-arrow-right"></span></button>
          {IS_DEBUG ? <button onClick={() => {
            if (this.webview.isDevToolsOpened()) {
              this.webview.closeDevTools();
            } else {
              this.webview.openDevTools();
            }
          }}><span className="fa fa-gear"></span></button> : null }
        </div>
        <div className="browser-pane">
          <Webview
            preload={preload}
            partition={partition}
            onWebview={(webview) => {
              this.gotWebview(webview);
            }}
          />
        </div>
      </div>
    );
  }
  gotWebview(webview:Electron.WebviewTag) {
    this.webview = webview;
    webview.addEventListener('did-navigate', ev => {
      this.setState({url: ev.url});
    })
    this.props.onWebview && this.props.onWebview(webview);
  }
  navigateToURL(url:string) {
    let wv = this.webview;
    if (!wv) {
      throw new Error('Trying to set URL before webview exists');
    }
    if (!url.startsWith('http')) {
      url = `https://${url}`
    }
    if (wv.getWebContents) {
      let wc = wv.getWebContents();
      if (wc) {
        wc.loadURL(url, {'extraHeaders': 'pragma: no-cache\n'});
        this.props.onURLChange && this.props.onURLChange(url);
        return;
      }
    }
    wv.src = url;
    this.props.onURLChange && this.props.onURLChange(url);
  }
}

interface ITab {
  id: number;
  start_url?: string;
  preload?: string;
  partition?: string;
  onWebview?: (x:Electron.WebviewTag, tab_index:number)=>void;
  onURLChange?: (url:string, tab_index:number)=>void;
}

interface TabbedBrowserProps {
  tabs: ITab[];
}
class TabbedBrowser extends React.Component<TabbedBrowserProps, {
  focused_tab: number;
}> {
  constructor(props:TabbedBrowserProps) {
    super(props);
    let focused_tab;
    if (props.tabs.length) {
      focused_tab = props.tabs[0].id;
    }
    this.state = {
      focused_tab,
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.tabs.length > this.props.tabs.length) {
      this.setState({focused_tab: nextProps.tabs.slice(-1)[0].id})
    } else {
      let tab_ids = nextProps.tabs.map(tab => tab.id);
      let idx = tab_ids.indexOf(this.state.focused_tab);
      if (idx === -1) {
        this.setState({focused_tab: tab_ids.slice(-1)[0]})
      }
    }
  }
  render() {
    let tabs = this.props.tabs.map((tab) => {
      return <div
        key={tab.id}
        onClick={() => {
          this.setState({focused_tab: tab.id});
        }}
        className={cx('tab', {
          'focused': tab.id === this.state.focused_tab,
        })}
      >Tab {tab.id+1}</div>
    })
    let bodies = this.props.tabs.map((tab, idx) => {
      return <div key={tab.id} className={cx('browser-wrap', {
        'hidden': tab.id !== this.state.focused_tab,
      })}>
        <Browser
          preload={tab.preload}
          partition={tab.partition}
          onWebview={(webview) => {
            tab.onWebview(webview, idx);
          }}
          onURLChange={(url) => {
            tab.onURLChange(url, idx);
          }}
        />
      </div>
    })
    return <div className="tabbed-browser">
      <div className="tabbed-browser-tab-list">
        {tabs}
      </div>
      <div className="tabbed-browser-body">
        {bodies}
      </div>
    </div>
  }
}


interface ValueOptions {
  key?: "" | "start-date" | "end-date";

  // This is a momentjs formatting string
  variation?: string;
}

interface ValueSelectProps {
  value: string;
  step: ChangeStep;
  director: RecordingDirector<ValueOptions>;
}
class StepValueSelect extends React.Component<ValueSelectProps, any> {
  render() {
    let { value, step, director } = this.props;
    let options:ValueOptions = step.options || {};

    if (step.isPassword && value) {
      value = '•'.repeat(8);
    }

    let defaultValue = options.key || "";

    let variation;
    let original;
    if (options.key) {
      original = <tr>
        <th>Original:</th>
        <td>{value}</td>
      </tr>;
    }
    if (options.key === "start-date" || options.key === "end-date") {
      let example;
      if (options.variation) {
        try {
          example = <tr>
            <th></th>
            <td>e.g. {localNow().format(options.variation)}</td>
          </tr>
        } catch(err) {
        }  
      }
      variation = <tbody>
        <tr>
            <th>Format:</th>
            <td>
              <select
                defaultValue=""
                value={options.variation}
                onChange={ev => {
                  options.variation = ev.target.value;
                  director.recording.updateStep(step, {options});
                }}
              >
                <option value="">---</option>
                <option>YYYY-MM-DD</option>
                <option>YYYY-DD-MM</option>
                <option>M/D/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>D/M/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>MMM DD, YYYY</option>
                <option>D</option>
                <option>DD</option>
                <option>M</option>
                <option>MM</option>
                <option>MMM</option>
                <option>YY</option>
                <option>YYYY</option>
              </select>
              
          </td>
        </tr>
        {example}
      </tbody>
    }

    return <table className="step-params">
      <tbody>
        <tr>
          <th>Value:</th>
          <td>
            <select onChange={ev => {
              if (!step.options) {
                step.options = {};
              }
              (step.options as ValueOptions).key = ev.target.value as any;
              director.emitChange();
            }} defaultValue={defaultValue}>
              <option value="">{value}</option>
              <option value="start-date">Start date</option>
              <option value="end-date">End date</option>
            </select>
          </td>
        </tr>
        {original}
      </tbody>
      {variation}
    </table>
  }
}


interface RecordingStepProps {
  step: TabRecStep;
  director: RecordingDirector<ValueOptions>;
  showall: boolean;
  showdebug: boolean;
}
class RecordingStep extends React.Component<RecordingStepProps, {
}> {
  render() {
    let { step, director, showall, showdebug } = this.props;
    let show = false;
    let is_current_step = director.getCurrentStep() === step
    if (showall) {
      show = true;
    } else {
      if (is_current_step) {
        show = true;
      } else {
        switch (step.type) {
          case 'navigate':
          case 'change':
          case 'download':
            show = true;
            break;
        }
      }
    }
    if (!show) {
      return null;
    }
    let guts;
    switch (step.type) {
      case 'navigate': {
        guts = <div>
          {sss('navigatestep', (url) => `Go to ${url}`)(step.url)}
        </div>
        break;
      }
      case 'change': {
        let value = step.displayValue || step.value;
        if (value === false) {
          value = sss('off');
        } else if (value === true) {
          value = sss('on');
        }
        guts = <div>Change {step.desc}
          <StepValueSelect
            value={value}
            step={step}
            director={director}
          />
        </div>
        break;
      }
      case 'focus': {
        guts = <div>Focus on {step.desc}</div>  
        break;
      }
      case 'click': {
        guts = <div>Click on {step.desc}</div>
        break;
      }
      case 'keypress': {
        let value = step.keys
          .map(x => x.key)
          // .filter(isInputValue)
          .join('');
        guts = <div>Type {value}</div>
        break;
      }
      case 'download': {
        guts = <div>Download a file</div>
        break;
      }
      case 'pageload': {
        guts = <div>Wait for page to load</div>
        break;
      }
    }
    let debug;
    if (showdebug) {
      debug = <pre>{JSON.stringify(step, null, 2)}</pre>
    }
    if (guts || showdebug) {
      return <div
        onDoubleClick={() => {
          director.chooseStep(step)
        }}
        className={cx("step", {
          'running': is_current_step,
        })}>
        {guts}{debug}
        <div className="step-actions">
          <SafetySwitch
            onClick={(ev) => {
              director.recording.removeStep(step);
            }}>
            <span className="fa fa-trash" />
          </SafetySwitch>
        </div>
      </div>
    } else {
      return null;
    }
  }
}


interface RecordPageProps {
  director: RecordingDirector<ValueOptions>;
  preload: string;
  partition: string;
  recording: Recording;
  onRecordingChange: Function,
  onLoad: Function;
}
/**
  Page for making and editing recordings.
*/
class RecordPage extends React.Component<RecordPageProps, {
  recording: Recording;
  showallsteps: boolean;
  debugmode: boolean;
}> {
  constructor(props:RecordPageProps) {
    super(props);
    this.state = {
      recording: props.recording,
      showallsteps: false,
      debugmode: false,
    };
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      recording: nextProps.recording,
    })
  }
  gotWebview(tab_id:number, webview:Electron.WebviewTag) {
    let { director, onLoad } = this.props;
    director.attachWebview(tab_id, webview);
    director.events.change.on(() => {
      this.setState(this.state);
    })
    director.events.step_started.on(() => {
      this.setState(this.state);
    })
    director.events.step_finished.on(() => {
      this.setState(this.state);
    })
    if (onLoad) {
      onLoad()
    }
  }
  render() {
    let { director, preload, partition, onRecordingChange } = this.props;
    let stop_button = <button
        className="icon"
        disabled={director.state === 'idle'}
        onClick={() => {
          director.pause();
        }}>
        <span className="fa fa-stop"/>
      </button>

    let save_button = <button
        onClick={() => {
          director.pause();
          onRecordingChange(director.recording);
        }}>{sss('Save')}</button>

    let record_button = <button
        className="icon"
        disabled={director.state === 'recording'}
        onClick={() => {
          director.startRecording();
        }}
        ><span className="fa fa-circle red" /></button>

    let steps = director.recording.steps
    .map((step, i) => {
      return <RecordingStep
        key={i}
        director={director}
        showall={this.state.showallsteps}
        showdebug={this.state.debugmode}
        step={step}
      />
    })
    .filter(x => x);

    let dummyLookup = (options:ValueOptions) => {
      let today = localNow();
      if (options.key === 'start-date') {
        let date = today.clone().subtract(2, 'months').startOf('month');
        return date.format(options.variation);
      } else if (options.key === 'end-date') {
        let date = today.clone().subtract(1, 'day');
        return date.format(options.variation);
      }
    }

    let recording_state;
    switch (director.state) {
      case 'idle': {
        recording_state = <div className="recording-state">
          {sss('Paused')}
        </div>
        break;
      }
      case 'recording': {
        recording_state = <div className="recording-state recording">
          {sss('Recording')}
        </div>
        break;
      }
      case 'playing': {
        recording_state = <div className="recording-state playing">
          {sss('Playing')}
        </div>
        break;
      }
    }

    let tabs = director.tab_list.map((tab, index):ITab => {
      return {
        id: tab.id,
        preload,
        partition,
        onURLChange: (url:string) => {
          this.props.director.setURL(tab.id, url);
        },
        onWebview: (webview) => {
          this.gotWebview(tab.id, webview);
        },
      }
    })

    return <div className="record-page">
      <div className="browser-wrap">
        <div className="record-instructions">
          To create a macro:
          <ol>
            <li>Sign in to your bank.  If your bank has a "remember this computer" option, check it.</li>
            <li>Sign out</li>
            <li>Click {record_button}</li>
            <li>For each account, download a supported file <Help>
              Supported formats
              <ul>
                <li>Quicken</li>
                <li>Microsoft Money</li>
                <li>OFX</li>
                <li>QFX</li>
              </ul>
              </Help> making sure to <b>adjust both the start and end date range</b>.</li>
            <li>Sign out</li>
            <li>Click {stop_button}</li>
            <li>Adjust each date field (in the panel at the right)</li>
            <li>Click {save_button}</li>
          </ol>
        </div>
        <TabbedBrowser
          tabs={tabs}
        />
      </div>
      <div className="recording-pane">
        {recording_state}
        <div className="controls">
          {record_button}
          <button
            className="icon"
            disabled={director.state === 'recording'}
            onClick={() => {
              director.pause();
              director.rewind();
            }}>
            <span className="fa fa-fast-backward" />
          </button>
          <button
            className="icon"
            disabled={director.state === 'recording'}
            onClick={() => {
              director.pause();
              director.backOneStep();
            }}>
            <span className="fa fa-step-backward" />
          </button>
          {stop_button}
          <button
            className="icon"
            disabled={director.state === 'recording'}
            onClick={() => {
              director.play(dummyLookup);
            }}
          ><span className="fa fa-play" /></button>
          <button
            className="icon"
            disabled={director.state === 'recording'}
            onClick={() => {
              director.playNextStep(dummyLookup);
            }}>
            <span className="fa fa-step-forward" />
          </button>
          {save_button}
        </div>
        <div className="steps">
          {steps}
        </div>
        <div className="controls">
          <div>
            <label><input
              type="checkbox"
              checked={this.state.showallsteps}
              onChange={(ev) => {
                this.setState({showallsteps: ev.target.checked});
              }}/> Show all steps</label>
            {IS_DEBUG ? <label>
                <input
                type="checkbox"
                checked={this.state.debugmode}
                onChange={(ev) => {
                  this.setState({debugmode: ev.target.checked});
                }}
                /> Debug
              </label> : null }
            {IS_DEBUG ? <label>
                <input
                type="checkbox"
                checked={director.showdebug}
                onChange={(ev) => {
                  director.showdebug = ev.target.checked;
                }}
                /> Show click markers
              </label> : null }
          </div>
          <SafetySwitch
            onClick={(ev) => {
              director.clear();
            }}>
            {sss('Delete all')}
          </SafetySwitch>
        </div>
      </div>
    </div>
  }
}

interface RecordingAppProps {
  preload: string;
  partition: string;
  bankmacro: BankMacro;
  recording: Recording;
  store: IStore;
  renderer: Renderer;
  onRecordingChange: Function,
  director: RecordingDirector<any>,
  onLoadRecordPage: Function,
}
class RecordingApp extends React.Component<RecordingAppProps, any> {
  render() {
    let { preload, partition, recording, onRecordingChange, director, onLoadRecordPage } = this.props;
    return <div className="page-wrap">
        <ToastDisplay />
        <RecordPage
          director={director}
          preload={preload}
          partition={partition}
          recording={recording}
          onLoad={onLoadRecordPage}
          onRecordingChange={onRecordingChange}
        />
    </div>
  }
}

export async function start(args:{
    room:string,
    container:HTMLElement,
    preload_url:string,
    macro_id:number,
    partition:string,
    response_id?:string,
    autoplay?: {
      onOrAfter: SerializedTimestamp,
      before: SerializedTimestamp,
    }
  }) {
  const renderer = new Renderer();
  
  let store = current_file.store;
  let BANKMACRO = await store.sub.bankmacro.get(args.macro_id);
  let recording:Recording = null
  let sync_result:SyncResult = {
    errors: [],
    imported_count: 0,
  }

  // attempt the password 3 times.
  let i = 0;
  while (true) {
    try {
      let plaintext = await store.sub.bankmacro.decryptRecording(BANKMACRO);
      recording = plaintext.recording;
      break;
    } catch(err) {
      if (err instanceof IncorrectPassword) {
        if (i >= 3) {
          throw err;
        }
      } else {
        throw err;
      }
    }
    i++;
  }

  let director = new RecordingDirector({
    recording: recording,
  });
  director.events.newpage.on(message => {
    if (!BANKMACRO.name) {
      store.sub.bankmacro.update(BANKMACRO.id, {name: message.title});
    }
  })
  director.events.file_downloaded.on(async ({localpath, filename, mimetype}) => {
    log.info('File downloaded', filename, localpath, mimetype);
    makeToast(sss('notify-downloaded-file', filename => `Downloaded file: ${filename}`)(filename));

    // process downloaded file
    let imported;
    let pendings;
    try {
      let result = await current_file.importFile(localpath);
      imported = result.imported;
      pendings = result.pendings;
    } catch(err) {
      log.error(`error importing: ${err}`);
      log.error(err.stack);
    }
    if (pendings && pendings.length) {
      log.info(`${pendings.length} unknown accounts`);
    }
    if (imported && imported.length) {
      log.info(`${imported.length} imported`);
      sync_result.imported_count += imported.length;
    }
  })
  director.events.error.on(err => {
    if (err instanceof TimeoutError) {
      makeToast(sss('Step took too long'), {
        className: 'error',
      });
    } else {
      makeToast(sss('Error running recording'), {
        className: 'error',
      });
    }
  })

  let loaded = false;

  renderer.registerRendering(() => {
    // const url = webview.getWebContents && webview.getWebContents() ? webview.getURL() : '';
    return <RecordingApp
      director={director}
      bankmacro={BANKMACRO}
      recording={recording}
      preload={args.preload_url}
      partition={args.partition}
      store={store}
      renderer={renderer}
      onLoadRecordPage={() => {
        if (loaded) {
          log.warn('Not rerunning onLoadRecordPage');
          return;
        }
        loaded = true;

        if (args.autoplay) {
          log.info('Starting autoplay');
          director.playFromBeginning((options:ValueOptions) => {
            if (options.key === 'start-date') {
              let date = ensureLocalMoment(loadTS(args.autoplay.onOrAfter));
              return date.format(options.variation);
            } else if (options.key === 'end-date') {
              let date = ensureLocalMoment(loadTS(args.autoplay.before));
              return date.format(options.variation);
            }
          })
          .then(() => {
            log.info('autoplay done', sync_result);
            if (args.response_id) {
              ipcRenderer.send('buckets:playback-response', sync_result)
            }
          })
          .catch(err => {
            log.error('autoplay error', err.toString());
            let current_window = remote.getCurrentWindow();
            current_window.show();
            current_window.focus();
            if (args.response_id) {
              sync_result.errors.push(err.toString())
              ipcRenderer.send('buckets:playback-response', sync_result)
            }
          });
        }
      }}
      onRecordingChange={(new_recording) => {
        store.sub.bankmacro.update(args.macro_id, {
          recording: new_recording,
        })
      }}
    />
  }, args.container);
  renderer.afterUpdate(() => {
    let title = sss('EXPERIMENTAL Buckets Macro Maker');
    if (BANKMACRO.name) {
      title = `${BANKMACRO.name} - ${title}`;
    }
    document.title = title;
  })

  window.addEventListener('hashchange', () => {
    renderer.doUpdate();
  }, false);

  // director.events.change.on(() => {
  //   console.log('doing update');
  //   renderer.doUpdate();
  // })

  store.bus.obj.on(async (ev) => {
    let obj = ev.obj;
    if (isObj(BankMacro, obj) && obj.id === args.macro_id) {
      BANKMACRO = Object.assign(BANKMACRO, obj);
      renderer.doUpdate();
    }
  })

  renderer.doUpdate()
}
