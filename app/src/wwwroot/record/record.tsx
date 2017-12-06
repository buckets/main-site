import * as React from 'react'
import * as moment from 'moment'
import * as cx from 'classnames'
import { remote } from 'electron'
import { RPCRendererStore } from '../../rpcstore'
import { isObj, IStore } from '../../store'
import { BankRecording } from '../../models/bankrecording'
import { Renderer } from '../../budget/render'
import { RecordingDirector, Recording, ChangeStep, RecStep, isInputValue } from '../../recordlib'
import { sss } from '../../i18n'
import { Router, Route, Link, Switch, Redirect} from '../../budget/routing'
import { DebouncedInput } from '../../input'
import { IncorrectPassword } from '../../error'


function setPath(x:string) {
  window.location.hash = '#' + x;
}


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
        this.elem = elem;
      }
    }}
      is
      autosize="on"
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
          <button onClick={() => {
            if (this.webview.isDevToolsOpened()) {
              this.webview.closeDevTools();
            } else {
              this.webview.openDevTools();
            }
          }}><span className="fa fa-gear"></span></button>
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

    let defaultValue = options.key || "";

    let variation;
    let original;
    if (options && !options.key) {
      original = <span className="original-value">({value})</span>;
    }
    if (options.key === "start-date" || options.key === "end-date") {
      variation = <select
          defaultValue=""
          onChange={ev => {
            options.variation = ev.target.value;
            step.options = options;
            director.emitChange();
          }}
        >
        <option value="">{value}</option>
        <option>YYYY-MM-DD</option>
        <option>YYYY-DD-MM</option>
        <option>M/D/YYYY</option>
        <option>MM/DD/YYYY</option>
        <option>D/M/YYYY</option>
        <option>DD/MM/YYYY</option>
        <option>D</option>
        <option>DD</option>
        <option>M</option>
        <option>MM</option>
        <option>MMM</option>
        <option>YY</option>
        <option>YYYY</option>
      </select>
    }

    return <span>
      <select onChange={ev => {
        console.log('changed', ev.target.value);
        if (!step.options) {
          step.options = {};
        }
        (step.options as ValueOptions).key = ev.target.value as any;
        director.emitChange();
      }} defaultValue={defaultValue}>
        <option value="">{value}</option>
        <option value="start-date">Start date...</option>
        <option value="end-date">End date...</option>
      </select>
      {original}
      {variation}
    </span>
  }
}


interface RecordingStepProps {
  step: RecStep;
  director: RecordingDirector<ValueOptions>;
}
class RecordingStep extends React.Component<RecordingStepProps, {
}> {
  render() {
    let { step, director } = this.props;
    let guts;
    switch (step.type) {
      case 'navigate': {
        guts = <div>
          {sss('navigatestep', (url) => `Go to ${url}`)(step.url)}
        </div>
        break;
      }
      case 'change': {
        console.log('change', step);
        let value = step.displayValue || step.value;
        if (value === false) {
          value = sss('off');
        } else if (value === true) {
          value = sss('on');
        }
        guts = <div>Change {step.desc} to
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
        console.log("keypress", step);
        let value = step.keys
          .map(x => x.key)
          .filter(isInputValue)
          .join('');
        if (!value) {
          break;
        }
        guts = <div>Change {step.desc} to {value}</div>
        break;
      }
      case 'download': {
        guts = <div>download a file</div>
        break;
      }
    }
    if (guts) {
      return <div className={cx("step", {
        'running': step === director.current_recording.steps[director.step_index],
      })}>
        {guts}
      </div>
    } else {
      return null;
    }
  }
}


interface RecordPageProps {
  preload: string;
  partition: string;
  recording: Recording;
  onRecordingChange: Function,
}
/**
  Page for making and editing recordings.
*/
class RecordPage extends React.Component<RecordPageProps, {
  recording: Recording;
}> {
  private director:RecordingDirector<ValueOptions>;
  constructor(props:RecordPageProps) {
    super(props);
    this.state = {
      recording: props.recording,
    };
    this.director = new RecordingDirector({
      recording: props.recording,
    });
  }
  componentWillReceiveProps(nextProps) {
    console.log('will receive props', nextProps);
    this.setState({
      recording: nextProps.recording,
    })
  }
  gotWebview(webview:Electron.WebviewTag) {
    this.director.attachWebview(webview);
    this.director.events.change.on(() => {
      this.setState(this.state);
    })
    this.director.events.step_started.on(() => {
      this.setState(this.state);
    })
    this.director.events.step_finished.on(() => {
      this.setState(this.state);
    })
    this.director.startRecording();
    console.log('recording');
  }
  render() {
    let { preload, partition, onRecordingChange } = this.props;
    let stop_button = <button
        disabled={this.director.state !== 'recording'}
        onClick={() => {
          this.director.pauseRecording();
        }}>
        <span className="fa fa-stop"/>
      </button>

    let save_button = <button
        onClick={() => {
          this.director.pauseRecording();
          onRecordingChange(this.director.current_recording);
        }}>{sss('Save')}</button>

    let steps = this.director.current_recording.steps
    .map((step, i) => {
      return <RecordingStep
        key={i}
        director={this.director}
        step={step}
      />
    })
    .filter(x => x);

    return <div className="record-page">
      <div className="browser-wrap">
        <div className="instructions">
          This tool will record you getting transaction information from your bank.  You will then be able to replay your recording to download transaction data in the future.
          <ol>
            <li>Sign in to your bank</li>
            <li>For each account, download an OFX/QFX making sure to <b>adjust both the start and end date range</b>.</li>
            <li>Click {stop_button}</li>
            <li>Fill out the form on the right</li>
            <li>Click {save_button}</li>
          </ol>
        </div>
        <Browser
          preload={preload}
          partition={partition}
          onURLChange={url => {
            this.director.setURL(url);
          }}
          onWebview={webview => { this.gotWebview(webview)}}
        />
      </div>
      <div className="recording-pane">
        <div className="controls">
          <button
            disabled={this.director.state === 'recording'}
            onClick={() => {
              this.director.startRecording();
            }}
            ><span className="fa fa-circle red" /></button>
          {stop_button}
          <button
            disabled={this.director.state === 'recording'}
            onClick={() => {
              this.director.play((options:ValueOptions) => {
                let today = moment();
                if (options.key === 'start-date') {
                  let date = today.subtract(2, 'months').startOf('month');
                  return date.format(options.variation);
                } else if (options.key === 'end-date') {
                  let date = today;
                  return date.format(options.variation);
                }
              });
            }}
          ><span className="fa fa-play" /></button>
          {save_button}
        </div>
        <div className="steps">
          {steps}
        </div>
      </div>
    </div>
  }
}

interface SignInPageProps {
  partition: string;
}
class SignInPage extends React.Component<SignInPageProps, any> {
  render() {
    let { partition } = this.props;
    return <div className="browser-wrap">
      <div className="instructions">
        Many banks require extra verification (e.g. security questions, being texted/emailed a code, etc.) when accessing their website from a new computer or device.  In order to remember this computer, follow these steps:
        <ol>
          <li>{sss("Enter your bank's URL below.")}</li>
          <li>{sss("Sign in.  Make sure you choose to have this computer remembered if asked.")}</li>
          <li>{sss("Click this button:")} <button
            onClick={() => {
              setPath('/record');
            }}>{sss('I signed in')}</button></li>
        </ol>
      </div>
      <Browser
        partition={partition} />
    </div>
  }
}

interface SettingsPageProps {
  bankrecording: BankRecording;
  store: IStore;
  renderer: Renderer;
}
class SettingsPage extends React.Component<SettingsPageProps, any> {
  render() {
    let { bankrecording, store, renderer } = this.props;
    return <div className="padded">
      {sss('Recording name:')} <DebouncedInput
        type="text"
        placeholder={sss("e.g. My Bank")}
        value={bankrecording.name}
        onChange={val => {
          renderer.doUpdate(() => {
            return store.bankrecording.update(bankrecording.id, {name: val})  
          })
        }}/>
    </div>
  }
}

interface RecordingAppProps {
  preload: string;
  partition: string;
  bankrecording: BankRecording;
  recording: Recording;
  store: IStore;
  renderer: Renderer;
  onRecordingChange: Function,
}
class RecordingApp extends React.Component<RecordingAppProps, any> {
  render() {
    let { preload, partition, bankrecording, recording, store, renderer, onRecordingChange } = this.props;
    let path = window.location.hash.substr(1);
    return <Router
      path={path}
      setPath={setPath}>
        <div className="app">
          <div className="nav recording-nav">
            <div>
              <div className="label">{bankrecording.name}</div>
              <Link relative to="/settings" exactMatchClass="selected"><span>{sss('Settings')}</span></Link>
              <Link relative to="/signin" exactMatchClass="selected"><span>{sss('Sign in')}</span></Link>
              <Link relative to="/record" exactMatchClass="selected"><span>{sss('Record')}</span></Link>
            </div>
          </div>
          <div className="content">
            <div className="page">
              <Switch>
                <Route path="/settings">
                  <SettingsPage
                    bankrecording={bankrecording}
                    store={store}
                    renderer={renderer}
                  />
                </Route>
                <Route path="/signin">
                  <SignInPage
                    partition={partition}
                  />
                </Route>
                <Route path="/record">
                  <RecordPage
                    preload={preload}
                    partition={partition}
                    recording={recording}
                    onRecordingChange={onRecordingChange}
                  />
                </Route>
                <Redirect to="/settings" />
              </Switch>
            </div>
          </div>
        </div>
    </Router>
  }
}

export async function start(args:{
    room:string,
    container:HTMLElement,
    preload_url:string,
    recording_id:number,
    partition:string,
  }) {
  const renderer = new Renderer();
  

  let store = new RPCRendererStore(args.room);
  let BANKRECORDING = await store.bankrecording.get(args.recording_id);
  let recording = null

  // attempt the password 3 times.
  let i = 0;
  while (true) {
    try {
      let plaintext = await store.bankrecording.decryptBankRecording(BANKRECORDING);
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

  renderer.registerRendering(() => {
    // const url = webview.getWebContents && webview.getWebContents() ? webview.getURL() : '';
    return <RecordingApp
      bankrecording={BANKRECORDING}
      recording={recording}
      preload={args.preload_url}
      partition={args.partition}
      store={store}
      renderer={renderer}
      onRecordingChange={(new_recording) => {
        console.log('recording change', new_recording);
        store.bankrecording.update(args.recording_id, {
          recording: new_recording,
        })
      }}
    />
  }, args.container);
  renderer.afterUpdate(() => {
    let title = 'EXPERIMENTAL Buckets Recorder';
    if (BANKRECORDING.name) {
      title = `${BANKRECORDING.name} - ${title}`;
    }
    document.title = title;
  })

  window.addEventListener('hashchange', () => {
    renderer.doUpdate();
  }, false);

  store.data.obj.on(async (ev) => {
    let obj = ev.obj;
    if (isObj(BankRecording, obj) && obj.id === args.recording_id) {
      console.log('Update of the recording this page is looking at');
      BANKRECORDING = Object.assign(BANKRECORDING, obj);
      renderer.doUpdate();
    }
  })

  renderer.doUpdate();
  remote.getCurrentWindow().show();
}
