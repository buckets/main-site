import * as React from 'react'
import * as moment from 'moment'
import { ipcRenderer } from 'electron'
import { RPCRendererStore } from '../../rpcstore'
import { isObj, IStore } from '../../store'
import { BankRecording } from '../../models/bankrecording'
import { Renderer } from '../../budget/render'
import { RecordingDirector, Recording, ChangeStep, KeyPressStep, isInputValue } from '../../recordlib'
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


interface StepValueDetailsProps {
  value: string;
  step: ChangeStep | KeyPressStep;
  director: RecordingDirector;
}
class StepValueDetails extends React.Component<StepValueDetailsProps, any> {
  render() {
    let { value, step, director } = this.props;
    return <div>
      <div className="step-value">{value}</div>
      <div>
        <select onChange={ev => {
          console.log('changed', ev.target.value);
          step.refkey = ev.target.value;
          director.emit('change');
        }} defaultValue={step.refkey || ''}>
          <option value="">Will always be the same</option>
          <option value="start-date">Start date</option>
          <option value="start-day">Start DAY</option>
          <option value="start-month">Start MONTH</option>
          <option value="start-year">Start YEAR</option>

          <option value="end-date">End date</option>
          <option value="end-day">End DAY</option>
          <option value="end-month">End MONTH</option>
          <option value="end-year">End YEAR</option>
        </select>
      </div>
    </div>
  }
}



interface RecordPageProps {
  preload: string;
  partition: string;
  recording: Recording;
  values: object;
  onRecordingChange: Function,
}
/**
  Page for making and editing recordings.
*/
class RecordPage extends React.Component<RecordPageProps, {
  recording: Recording;
  values: object;
  // Date to direct the user to choose
  start_date: moment.Moment;
  end_date: moment.Moment;
}> {
  private director:RecordingDirector;
  constructor(props:RecordPageProps) {
    super(props);
    const today = moment();

    let start_date = moment().day(15).subtract(2, 'months');
    if (start_date.day() == today.day()) {
      start_date.add(1, 'day');
    }
    let end_date = start_date.clone().add(1, 'month').add(1, 'day');
    this.state = {
      recording: props.recording,
      values: props.values,
      start_date,
      end_date,
    };
    this.director = new RecordingDirector({
      recording: props.recording,
      values: props.values,
    });
  }
  componentWillReceiveProps(nextProps) {
    console.log('will receive props', nextProps);
    this.setState({
      recording: nextProps.recording,
      values: nextProps.values,
    })
  }
  gotWebview(webview:Electron.WebviewTag) {
    this.director.attachWebview(webview);
    this.director.on('change', () => {
      this.setState(this.state);
    })
    this.director.startRecording();
    console.log('recording');
  }
  render() {
    let { preload, partition, onRecordingChange } = this.props;
    let { start_date, end_date } = this.state;
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
          onRecordingChange(this.director.current_recording, this.director.current_values);
        }}>{sss('Save')}</button>

    let steps = this.director.current_recording.steps
    .filter((step) => {
      switch (step.type) {
        case 'navigate':
        case 'change':
        case 'keypress': {
          return true;
        }
      }
      return false;
    })
    .map((step, i) => {
      let question;

      switch (step.type) {
        case 'navigate': {
          question = <div>{sss('navigatestep', (url) => `Go to ${url}`)(step.url)}</div>
          break;
        }
        case 'change': {
          let value = step.displayValue || step.value;
          question = <StepValueDetails
            value={value}
            step={step}
            director={this.director}
            />
          break;
        }
        case 'keypress': {
          let value = step.keys
            .map(x => x.key)
            .filter(isInputValue)
            .join('');
          if (!value) {
            break;
          }
          question = <StepValueDetails
            value={value}
            step={step}
            director={this.director}
            />
          break;
        }
        case 'download': {
          question = <div>download file</div>
          break;
        }
      }
      if (question) {
        return <div key={i} className="step-question">{question}</div>  
      }
    })
    .filter(x => x);

    return <div className="record-page">
      <div className="browser-wrap">
        <div className="instructions">
          This tool will record you getting transaction information from your bank.  You will then be able to replay your recording to download transaction data in the future.
          <ol>
            <li>Sign in to your bank</li>
            <li>For each account, download an OFX/QFX file for the date range <b>{start_date.format('ll')}</b> to <b>{end_date.format('ll')}</b>.</li>
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
              this.director.play();
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
  values: object;
  store: IStore;
  renderer: Renderer;
  onRecordingChange: Function,
}
class RecordingApp extends React.Component<RecordingAppProps, any> {
  render() {
    let { preload, partition, bankrecording, recording, values, store, renderer, onRecordingChange } = this.props;
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
                    values={values}
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
  
  // const director = new RecordingDirector(webview);
  // director.on('recorded-step', () => {
  //   renderer.doUpdate();
  // })

  let store = new RPCRendererStore(args.room);
  let BANKRECORDING = await store.bankrecording.get(args.recording_id);
  let recording = null,
      values = null;

  // attempt the password 3 times.
  let i = 0;
  while (true) {
    try {
      let plaintext = await store.bankrecording.decryptBankRecording(BANKRECORDING);
      recording = plaintext.recording;
      values = plaintext.values;
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
      values={values}
      preload={args.preload_url}
      partition={args.partition}
      store={store}
      renderer={renderer}
      onRecordingChange={(new_recording, new_values) => {
        console.log('recording change', new_recording, new_values);
        store.bankrecording.update(args.recording_id, {
          recording: new_recording,
          values: new_values,
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

  store.data.on('obj', async (ev) => {
    let obj = ev.obj;
    if (isObj(BankRecording, obj) && obj.id === args.recording_id) {
      console.log('Update of the recording this page is looking at');
      BANKRECORDING = Object.assign(BANKRECORDING, obj);
      renderer.doUpdate();
    }
  })

  renderer.doUpdate();
  ipcRenderer.send('buckets:show-window');
}
