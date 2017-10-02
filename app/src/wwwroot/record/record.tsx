import * as React from 'react'
import { Renderer } from '../../budget/render'
import { RecordingDirector } from '../../recordlib'
import { sss } from '../../i18n'

class Webview extends React.Component<any, any> {
  private elem:Electron.WebviewTag;
  shouldComponentUpdate() {
    return false;
  }
  render() {
    return <webview ref={elem => {
      console.log('ref', elem);
      if (elem) {
        this.elem = elem;
        elem.src = 'https://www.google.com';
      }
    }}
      is
      autosize="on"
      disableguestresize
      style={{width: '100%'}}
      partition="persist:recordtest2" />
  }
}

interface BrowserProps {
  preload?: string;
}
class Browser extends React.Component<BrowserProps, {
  foo: string;
}> {
  private webview:Electron.WebviewTag;
  constructor(props) {
    super(props);
    this.state = {
      foo: '',
    }
  }
  render() {
    return <div style={{width:'100%'}}>
      <div>
        React-controlled
        <button onClick={() => {
          this.setState({foo: 'something' + Math.random()});
        }}>foo {this.state.foo}</button>
      </div>
      <Webview />
    </div>
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
  navigateToURL(url:string) {
    let wv = this.props.webview;
    if (wv.getWebContents) {
      let wc = wv.getWebContents();
      if (wc) {
        wc.loadURL(url, {'extraHeaders': 'pragma: no-cache\n'});
        return
      }
    }
    wv.src = url;
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
    return <Browser preload={preload_url} />
  }, container);


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
