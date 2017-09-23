import * as React from 'react'
import { Renderer } from '../../budget/render'

interface HeaderProps {
  webview: Electron.WebviewTag;
  url: string;
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
    let { webview } = this.props;
    let { url } = this.state;
    return <div className="control">
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
      <div className="overlay-wrap">
        <div className="overlay"><span className="fa fa-chevron-up"></span> Enter a URL <span className="fa fa-chevron-up"></span></div>
      </div>
    </div>
  }
  navigateToURL(url:string) {
    this.props.webview.src = url;
  }
}

export function start(control, webview:Electron.WebviewTag) {
  const renderer = new Renderer();
  renderer.registerRendering(() => {
    const url = webview.getWebContents && webview.getWebContents() ? webview.getURL() : '';
    return <Header
      webview={webview}
      url={url}
    />
  }, control);

  const events = [
    // 'load-commit',
    // 'did-finish-load',
    // 'did-fail-load',
    // 'did-frame-finish-load',
    // 'did-start-loading',
    // 'did-stop-loading',
    // 'did-get-response-details',
    // 'did-get-redirect-request',
    // 'dom-ready',
    // // 'page-title-updated',
    // // 'page-favicon-updated',
    // // 'enter-html-full-screen',
    // // 'leave-html-full-screen',
    // // 'console-message',
    // 'found-in-page',
    // 'new-window',
    // 'will-navigate',
    // // 'did-navigate',
    // 'did-navigate-in-page',
    // 'close',
    // // 'ipc-message',
    // 'crashed',
    // 'gpu-crashed',
    // 'plugin-crashed',
    // 'destroyed',
    // 'media-started-playing',
    // 'media-paused',
    // 'did-change-theme-color',
    // // 'update-target-url',
    // 'devtools-opened',
    // 'devtools-closed',
    // 'devtools-focused',
  ];
  events.forEach(event => {
    webview.addEventListener(event as any, (ev) => {
      console.log('event', event, ev);
    }, false);
  })

  webview.addEventListener('console-message', (ev) => {
    console.log('webview:', ev.message);
  }, false)
  webview.addEventListener('page-favicon-updated', (ev) => {
    // console.log('favicon', ev);
    // if (ev.favicons.length) {
    //   let favicon = ev.favicons[0];
    // } else {

    // }
  })
  webview.addEventListener('did-navigate', (ev) => {
    console.log('did-navigate');
    renderer.doUpdate();
  }, false);
  webview.addEventListener('page-title-updated', (ev) => {
    document.title = `Buckets Recorder - ${ev.title}`;
  }, false);

  webview.addEventListener('did-start-loading', () => {
    renderer.doUpdate();
  }, false);
  webview.addEventListener('did-stop-loading', () => {
    renderer.doUpdate();
  }, false);
  webview.addEventListener('ipc-message', (ev, args) => {
    if (ev.channel === 'rec:click') {
      let data = ev.args[0];
      console.log('click', data);
      setTimeout(() => {
        console.log('sending input event');
        webview.sendInputEvent({
          type: 'mouseDown',
          x: data.pageX,
          y: data.pageY,
        })
        webview.sendInputEvent({
          type: 'mouseUp',
          x: data.pageX,
          y: data.pageY,
        })
      }, 5000);
    } else if (ev.channel === 'rec:keydown') {
      let data = ev.args[0];
      console.log('keydown', data);
      setTimeout(() => {
        console.log('sending keydown event', data.keyCode);
        webview.sendInputEvent({
          type: 'keyDown',
          keyCode: data.keyCode,
        })
        webview.sendInputEvent({
          type: 'keyUp',
          keyCode: data.keyCode,
        })
      }, 5000)
    } else if (ev.channel === 'rec:change') {
      let data = ev.args[0];
      console.log('change', data);
    } else {

    }
  })

  // webview.addEventListener('did-fail-load', () => {
  //   console.log('did fail load');
  // })
  // webview.addEventListener('dom-ready', () => {
  //   console.log('dom-ready webview');
  // }, false)
  // webview.src = 'http://127.0.0.1:8080';

  renderer.doUpdate();
}
