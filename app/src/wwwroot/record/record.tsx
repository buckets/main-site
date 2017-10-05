import * as React from 'react'
import { Renderer } from '../../budget/render'
import { RecordingDirector } from '../../recordlib'
import { sss } from '../../i18n'
import { Router, Route, Link, Switch, Redirect} from '../../budget/routing'


interface WebviewProps {
  onWebview?: (x:Electron.WebviewTag)=>void;
  preload?: string;
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
    let { preload } = this.props;
    return <webview ref={elem => {
      if (elem) {
        this.elem = elem;
      }
    }}
      is
      autosize="on"
      preload={preload}
      partition="persist:recordtest2" />
  }
}

interface BrowserProps {
  preload?: string;
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
    let { preload } = this.props;
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

interface RecordPageProps {
  preload: string;
}
class RecordPage extends React.Component<RecordPageProps, any> {
  private director:RecordingDirector;
  constructor(props) {
    super(props);
    this.state = {};
    this.director = new RecordingDirector();
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
    let { preload } = this.props;
    let stop_button = <button
        disabled={this.director.state !== 'recording'}
        onClick={() => {
          this.director.pauseRecording();
        }}>
        <span className="fa fa-stop"/>
      </button>

    let steps = this.director.current_recording.steps
    .filter((step) => {
      switch (step.type) {
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
        case 'change': {
          question = <div>
            <div className="step-value">{step.displayValue || step.value}</div>
            <div>
              <select>
                <option value="">Will always be the same</option>
                <option>Account</option>
                <option>Start date</option>
                <option>Start DAY</option>
                <option>Start MONTH</option>
                <option>Start YEAR</option>

                <option>End date</option>
                <option>End DAY</option>
                <option>End MONTH</option>
                <option>End YEAR</option>
                
                <option>Other</option>
              </select>
            </div>
          </div>
          break;
        }
        case 'keypress': {
          let value = step.keys.map(x => x.key).join('')
          question = <div>
            <div className="step-value">{value}</div>
            <div>
              <select>
                <option value="">---</option>
                <option value="static">Will always be the same</option>
                <option>Account number</option>
                <option>Account password/PIN</option>
                <option>Start date</option>
                <option>Start DAY</option>
                <option>Start MONTH</option>
                <option>Start YEAR</option>

                <option>End date</option>
                <option>End DAY</option>
                <option>End MONTH</option>
                <option>End YEAR</option>
                
                <option>Other</option>
              </select>
             </div>
            </div>
          break;
        }
        case 'download': {
          question = <div>download file</div>
          break;
        }
      }
      return <div key={i} className="step-question">{question}</div>
    })
    return <div className="record-page">
      <div className="browser-wrap">
        <div className="instructions">
          This tool will record you getting transaction information from your bank.  You will then be able to replay your recording to download transaction data in the future.
          <ol>
            <li>Sign in to your bank</li>
            <li>For each account, download an OFX/QFX file for the date range Aug 15, 2017 to Sep 15, 2017</li>
            <li>Click {stop_button}</li>
            <li>Fill out the form on the right</li>
          </ol>
        </div>
        <Browser
          preload={preload}
          onURLChange={url => {
            this.director.setURL(url);
          }}
          onWebview={webview => { this.gotWebview(webview)}}
        />
      </div>
      <div className="recording-pane">
        <div className="controls">
          <button disabled={this.director.state === 'recording'}><span className="fa fa-circle red" /></button>
          {stop_button}
          <button
            disabled={this.director.state === 'recording'}
            onClick={() => {
              this.director.play();
            }}
          ><span className="fa fa-play" /></button>
        </div>
        <div className="steps">
          {steps}
        </div>
      </div>
    </div>
  }
}

class SignInPage extends React.Component<any, any> {
  render() {
    return <div className="browser-wrap">
      <div className="instructions">
        Many banks require extra verification (e.g. security questions, being texted/emailed a code, etc.) when accessing their website from a new computer or device.  In order to remember this computer, follow these steps:
        <ol>
          <li>{sss("Enter your bank's URL below.")}</li>
          <li>{sss("Sign in.  Make sure you choose to have this computer remembered if asked.")}</li>
          <li>{sss("Click this button:")} <button>I signed in</button></li>
        </ol>
      </div>
      <Browser />
    </div>
  }
}

export function setPath(x:string) {
  window.location.hash = '#' + x;
}

interface RecordingAppProps {
  preload: string;
}
class RecordingApp extends React.Component<RecordingAppProps, any> {
  render() {
    let { preload } = this.props;
    let path = window.location.hash.substr(1);
    return <Router
      path={path}
      setPath={setPath}>
        <div className="app">
          <div className="nav recording-nav">
            <div>
              <div className="label">America First Credit Union</div>
              <Link relative to="/settings" exactMatchClass="selected"><span>{sss('Settings')}</span></Link>
              <Link relative to="/signin" exactMatchClass="selected"><span>{sss('Sign in')}</span></Link>
              <Link relative to="/record" exactMatchClass="selected"><span>{sss('Record')}</span></Link>
            </div>
          </div>
          <div className="content">
            <div className="page">
              <Switch>
                <Route path="/settings">
                  <div>Settings</div>
                </Route>
                <Route path="/signin">
                  <SignInPage />
                </Route>
                <Route path="/record">
                  <RecordPage
                    preload={preload}
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



export function start(container, preload_url:string) {
  const renderer = new Renderer();
  
  // const director = new RecordingDirector(webview);
  // director.on('recorded-step', () => {
  //   renderer.doUpdate();
  // })

  renderer.registerRendering(() => {
    // const url = webview.getWebContents && webview.getWebContents() ? webview.getURL() : '';
    return <RecordingApp
      preload={preload_url} />
  }, container);

  window.addEventListener('hashchange', () => {
    renderer.doUpdate();
  }, false);

  // const events = [
  //   // 'load-commit',
  //   // 'did-finish-load',
  //   // 'did-fail-load',
  //   // 'did-frame-finish-load',
  //   // 'did-start-loading',
  //   // 'did-stop-loading',
  //   // 'did-get-response-details',
  //   // 'did-get-redirect-request',
  //   // 'dom-ready',
  //   // // 'page-title-updated',
  //   // // 'page-favicon-updated',
  //   // // 'enter-html-full-screen',
  //   // // 'leave-html-full-screen',
  //   // // 'console-message',
  //   // 'found-in-page',
  //   // 'new-window',
  //   // 'will-navigate',
  //   // // 'did-navigate',
  //   // 'did-navigate-in-page',
  //   // 'close',
  //   // // 'ipc-message',
  //   // 'crashed',
  //   // 'gpu-crashed',
  //   // 'plugin-crashed',
  //   // 'destroyed',
  //   // // 'media-started-playing',
  //   // // 'media-paused',
  //   // // 'did-change-theme-color',
  //   // // 'update-target-url',
  //   // // 'devtools-opened',
  //   // // 'devtools-closed',
  //   // // 'devtools-focused',
  // ];
  // events.forEach(event => {
  //   webview.addEventListener(event as any, (ev) => {
  //     console.log('event', event, ev);
  //   }, false);
  // })

  // webview.addEventListener('console-message', (ev) => {
  //   // console.log('webview:', ev.message);
  // }, false)
  // webview.addEventListener('page-favicon-updated', (ev) => {
  //   // console.log('favicon', ev);
  //   // if (ev.favicons.length) {
  //   //   let favicon = ev.favicons[0];
  //   // } else {

  //   // }
  // })
  // webview.addEventListener('did-navigate', (ev) => {
  //   console.log('did-navigate');
  //   renderer.doUpdate();
  // }, false);
  // webview.addEventListener('page-title-updated', (ev) => {
  //   document.title = `[Experimental] Buckets Recorder - ${ev.title}`;
  // }, false);

  // webview.addEventListener('did-start-loading', () => {
  //   renderer.doUpdate();
  // }, false);
  // webview.addEventListener('did-stop-loading', () => {
  //   renderer.doUpdate();
  // }, false);

  // // webview.addEventListener('did-fail-load', () => {
  // //   console.log('did fail load');
  // // })
  // // webview.addEventListener('dom-ready', () => {
  // //   console.log('dom-ready webview');
  // // }, false)
  
  // // while debugging
  // webview.src = 'http://127.0.0.1:8080';
  // director.startRecording();
  // director.setURL(webview.src);

  renderer.doUpdate();
}
