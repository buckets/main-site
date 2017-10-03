import * as React from 'react'
import { Renderer } from '../../budget/render'
import { RecordingDirector } from '../../recordlib'
import { sss } from '../../i18n'
import { Router, Route, Link, Switch, Redirect, WithRouting} from '../../budget/routing'


interface WebviewProps {
  onWebview?: (x:Electron.WebviewTag)=>void;
}
class Webview extends React.Component<any, any> {
  private elem:Electron.WebviewTag;
  shouldComponentUpdate() {
    return false;
  }
  componentDidMount() {
    this.props.onWebview && this.props.onWebview(this.elem);
  }
  render() {
    return <webview ref={elem => {
      if (elem) {
        this.elem = elem;
      }
    }}
      is
      autosize="on"
      style={{width: '100%'}}
      partition="persist:recordtest2" />
  }
}

interface BrowserProps {
  preload?: string;
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
    this.navigateToURL('https://www.google.com')
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
        return;
      }
    }
    wv.src = url;
  }
}

interface HeaderProps {
  webview: Electron.WebviewTag;
  url: string;
  director: RecordingDirector;
  renderer: Renderer;
}
class Header extends React.Component<HeaderProps, {
  url: string;
}> {
  constructor(props:HeaderProps) {
    super(props);
    this.state = {
      url: props.url,
    }
  }
  shouldComponentUpdate() {
    return true;
  }
  componentWillReceiveProps(nextProps:HeaderProps) {
    this.setState({url: nextProps.url});
  }
  render() {
    let { webview, director, renderer } = this.props;
    let { url } = this.state;

    let record_button;
    if (director.is_recording) {
      record_button = <button onClick={() => {
        renderer.doUpdate(() => {
          director.pauseRecording();
        });
      }}>
        <span className="fa fa-stop"></span> {sss('verb.Stop', 'Stop')}
      </button>
    } else {
      record_button = <button onClick={() => {
        renderer.doUpdate(() => {
          director.startRecording();
          director.setURL(this.props.url);
        })
      }}><span className="fa fa-circle red"></span> {sss('verb.Record', 'Record')}</button>
    }

    let play_button;
    if (!director.is_recording) {
      play_button = <button onClick={() => {
        renderer.doUpdate(() => {
          director.play();
        });
      }}>
        <span className="fa fa-play"></span> {sss('verb.Play', 'Play')}</button>
    }

    return <div>
      <div className="control">

        <button onClick={() => {
          webview.goBack();
        }}>
          <span className="fa fa-chevron-left"></span>
        </button>
        <button onClick={() => {
          webview.goForward();
        }}>
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
        <button onClick={() => {
          webview.reload();
        }}>
          <span className="fa fa-refresh"></span>
        </button>
        <button onClick={() => {
          this.navigateToURL(this.state.url);
        }}><span className="fa fa-arrow-right"></span></button>
        <button onClick={() => {
          if (webview.isDevToolsOpened()) {
            webview.closeDevTools();
          } else {
            webview.openDevTools();
          }
        }}><span className="fa fa-gear"></span></button>
      </div>

      <div className="control">
        {record_button}
        {play_button}
      </div>
    </div>
  }
  
}

export function setPath(x:string) {
  window.location.hash = '#' + x;
}

class RecordingApp extends React.Component<any, any> {
  render() {
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
                  <Browser />
                </Route>
                <Route path="/record">
                  <div>Record</div>
                </Route>
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
