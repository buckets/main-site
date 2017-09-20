import * as React from 'react'
import { Renderer } from '../../budget/render'

export function start(control, webview:Electron.WebviewTag) {
  const renderer = new Renderer();
  renderer.registerRendering(() => {
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
        <input type="text" placeholder="https://www.example.com/"/>
        <button onClick={() => {
          webview.reload();
        }}>
          <span className="fa fa-refresh"></span>
        </button>
        <button><span className="fa fa-arrow-right"></span></button>
        <div className="overlay-wrap">
          <div className="overlay"><span className="fa fa-chevron-up"></span> Enter a URL <span className="fa fa-chevron-up"></span></div>
        </div>
      </div>
  }, control);

  const events = ['load-commit',
    'did-finish-load',
    'did-fail-load',
    'did-frame-finish-load',
    'did-start-loading',
    'did-stop-loading',
    'did-get-response-details',
    'did-get-redirect-request',
    'dom-ready',
    // 'page-title-updated',
    'page-favicon-updated',
    // 'enter-html-full-screen',
    // 'leave-html-full-screen',
    // 'console-message',
    'found-in-page',
    'new-window',
    'will-navigate',
    'did-navigate',
    'did-navigate-in-page',
    'close',
    'ipc-message',
    'crashed',
    'gpu-crashed',
    'plugin-crashed',
    'destroyed',
    'media-started-playing',
    'media-paused',
    'did-change-theme-color',
    // 'update-target-url',
    'devtools-opened',
    'devtools-closed',
    'devtools-focused'];
  events.forEach(event => {
    webview.addEventListener(event as any, () => {
      console.log('event', event);
    }, false);
  })

  webview.addEventListener('console-message', (ev) => {
    console.log('WEBVIEW:', ev.message);
  }, false)
  webview.addEventListener('page-favicon-updated', (ev) => {
    // console.log('favicon', ev);
    // if (ev.favicons.length) {
    //   let favicon = ev.favicons[0];
    // } else {

    // }
  })
  webview.addEventListener('page-title-updated', (ev) => {
    document.title = `Buckets Recorder - ${ev.title}`;
  }, false);

  webview.addEventListener('did-start-loading', () => {
    renderer.doUpdate();
  }, false);
  webview.addEventListener('did-stop-loading', () => {
    renderer.doUpdate();
  }, false);

  // webview.addEventListener('did-fail-load', () => {
  //   console.log('did fail load');
  // })
  // webview.addEventListener('dom-ready', () => {
  //   console.log('dom-ready webview');
  // }, false)
  webview.src = 'http://127.0.0.1:8080';

  renderer.doUpdate();
}
