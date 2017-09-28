import {ipcRenderer} from 'electron'
import {EventEmitter} from 'events'
import { getBounds, IBounds } from './position'


//-----------------------------------------------------------
// RPC
//-----------------------------------------------------------
interface IRPCHandler {
  (params?:any):(any|Promise<any>);
}
interface IRPCSendFunction {
  (channel:string, message:object):void;
}
export class RPC {
  static readonly CALL_CHAN = 'rpc:call';
  static readonly RESP_CHAN = 'rpc:response';

  private nextid = 0;
  private pending:{
    [k:number]: {
      resolve: (result)=>void;
      reject: (error)=>void;
    }
  } = {};
  private handlers:{
    [method:string]: IRPCHandler;
  } = {};
  constructor(private send:IRPCSendFunction) {
  }
  addHandler(method:string, func:IRPCHandler) {
    this.handlers[method] = func;
  }
  addHandlers(handlers:{[method:string]: IRPCHandler}) {
    Object.assign(this.handlers, handlers);
  }
  call<T>(method:string, params?:object):Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let rpcid = this.nextid++;
      this.pending[rpcid] = {resolve, reject}
      this.send(RPC.CALL_CHAN, {rpcid, method, params});
    })
  }
  private sendResult(rpcid:number, result:any, error:any) {
    this.send(RPC.RESP_CHAN, {rpcid, result, error});
  }
  async handleCall(args:{rpcid:number, method:string, params?:object}) {
    let {rpcid, method, params} = args;
    try {
      let result = await this.handlers[method](params);
      this.sendResult(rpcid, result, null);
    } catch(err) {
      this.sendResult(rpcid, null, err);
    }
  }
  async handleResponse(args:{rpcid:number, result:any, error?:any}) {
    let {rpcid, result, error} = args;
    let pending = this.pending[rpcid];
    delete this.pending[rpcid];
    if (error) {
      pending.reject(error);
    } else {
      pending.resolve(result);
    }
  }
}

function inWebviewRPC():RPC {
  let rpc = new RPC((channel:string, args) => {
    ipcRenderer.sendToHost(channel, args);
  })
  ipcRenderer.on(RPC.CALL_CHAN, (ev, message) => {
    rpc.handleCall(message);
  })
  ipcRenderer.on(RPC.RESP_CHAN, (ev, message) => {
    rpc.handleResponse(message);
  })
  return rpc
}

function inHostRPC(webview:Electron.WebviewTag):RPC {
  let rpc = new RPC((channel:string, args) => {
    let wc = webview.getWebContents();
    wc.send(channel, args);
  })
  webview.addEventListener('ipc-message', (ev) => {
    if (ev.channel === RPC.RESP_CHAN) {
      rpc.handleResponse(ev.args[0]);
    } else if (ev.channel === RPC.CALL_CHAN) {
      rpc.handleCall(ev.args[0]);
    }
  })
  return rpc
}

//-----------------------------------------------------------
// utilities
//-----------------------------------------------------------
function wait(time:number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  })
}

//-----------------------------------------------------------
// DOM element identification
//-----------------------------------------------------------
interface UniqueElementID {
  xpaths: string[];
}

function escapeQuote(x:string):string {
  return x.replace(/"/g, '&quot;');
}

// uniquely identify an element on a page
export function identifyElement(el:HTMLElement):UniqueElementID {
  let xpaths:string[] = [];

  let tagName = el.tagName.toLowerCase();
  let id = el.getAttribute('id');
  let name = el.getAttribute('name');
  let className = el.getAttribute('class');
  let type= el.getAttribute('type');

  if (id) {
    xpaths.push(`//${tagName}[@id="${escapeQuote(id)}"]`);
    if (name) {
      xpaths.push(`//${tagName}[@id="${escapeQuote(id)}" and @name="${escapeQuote(name)}"]`);
    }
  }
  if (name) {
    xpaths.push(`//${tagName}[@name="${escapeQuote(name)}"]`)
    if (type) {
      xpaths.push(`//${tagName}[@name="${escapeQuote(name)}" and @type="${escapeQuote(type)}"]`)
    }
  }
  if (type) {
    xpaths.push(`//${tagName}[@type="${escapeQuote(type)}"]`)
  }
  if (className) {
    xpaths.push(`//${tagName}[@class="${escapeQuote(className)}"]`);
  }

  xpaths = xpaths.filter(isXpathUnique);
  
  if (!xpaths.length) {
    xpaths.push(xpathFromRoot(el));  
  }
  console.log('xpaths', xpaths);
  return {xpaths};
}

// compute the xpath of an element from the root
function xpathFromRoot(el:HTMLElement, root?:HTMLElement):string {
  root = root || null;
  let parts = [];
  let n = el;
  while (n !== root) {
    let parent = n.parentElement;
    if (parent === null) {
      // only child
      parts.push(n.tagName.toLowerCase());
    } else {
      let children = Array.from(parent.children).filter((child:HTMLElement) => {
        return child.tagName === n.tagName;
      })
      if (children.length === 1) {
        // only child
        parts.push(n.tagName.toLowerCase());
      } else {
        // big family
        let idx = 0;
        for (idx = 0; idx < children.length; idx++) {
          if (n === children[idx]) {
            break;
          }
        }
        parts.push(`${n.tagName.toLowerCase()}[${idx+1}]`)
      }
    }
    n = parent;
  }
  parts.reverse();
  return '/' + parts.join('/');
}

function isXpathUnique(xpath:string):boolean {
  let iter = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
  iter.iterateNext();
  let second = iter.iterateNext();
  return second === null;
}

// findElement
export function findElement(ident:UniqueElementID):HTMLElement {
  for (var i = 0; i < ident.xpaths.length; i++) {
    let xpath = ident.xpaths[i];
    let iter = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    let first = iter.iterateNext();
    let second = iter.iterateNext();
    if (second === null) {
      return first as HTMLElement;
    }
  }
  return null;
}



//-----------------------------------------------------------
// Recordings
//-----------------------------------------------------------
export type RecStep = 
  NavigateStep
  | PageLoadStep
  | KeyPressStep
  | ClickStep
  | FocusStep
  | ChangeStep;

// navigate
export interface NavigateStep {
  type: 'navigate';
  url: string;
}
export function isNavigateStep(x:RecStep):x is NavigateStep {
  return (<NavigateStep>x).type === 'navigate';
}

// keypress
export interface KeyPressStep {
  type: 'keypress';
  element: UniqueElementID;
  keys: Array<{
    key: string;
    modifiers: string[];
  }>;
}
export function isKeyPressStep(x:RecStep):x is KeyPressStep {
  return (<KeyPressStep>x).type === 'keypress';
}

// click
export interface ClickStep {
  type: 'click';
  element: UniqueElementID;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  offsetX: number;
  offsetY: number;
}
export function isClickActionStep(x:RecStep):x is ClickStep {
  return (<ClickStep>x).type === 'click';
}

// focus
export interface FocusStep {
  type: 'focus';
  element: UniqueElementID;
}
export function isFocusStep(x:RecStep):x is FocusStep {
  return (<FocusStep>x).type === 'focus';
}

// change
export interface ChangeStep {
  type: 'change';
  element: UniqueElementID;
  value: any;
}
export function isChangeStep(x:RecStep):x is ChangeStep {
  return (<ChangeStep>x).type === 'change';
}

// pageload
export interface PageLoadStep {
  type: 'pageload';
}
export function isPageLoadStep(x:RecStep):x is PageLoadStep {
  return (<PageLoadStep>x).type === 'pageload';
}

export class Recording {
  public steps:Array<RecStep> = [];

  addStep(step:RecStep) {
    console.log('addStep', step);
    if (this.steps.length === 0) {
      this.steps.push(step)
      return;
    }

    if (isKeyPressStep(step)) {
      let last_step = this.steps[this.steps.length-1];
      if (isKeyPressStep(last_step)) {
        // combine keypresses
        last_step.keys = last_step.keys.concat(step.keys);
        return;
      }
    }
    // otherwise just add it
    this.steps.push(step);
  }
}


//-----------------------------------------------------------
// in-Webview Recorder
//-----------------------------------------------------------
export class Recorder {
  private rpc:RPC;
  constructor() {
    this.rpc = inWebviewRPC();
    this.rpc.addHandlers({
      'getbounds': (params:{element:UniqueElementID}) => {
        let { element } = params;
        try {
          let elem = findElement(element);
          if (elem === null) {
            return null;
          }
          return getBounds(elem);
        } catch(err) {
          return null;
        }
      },
      'rec:do-focus': (step:FocusStep) => {
        let { element } = step;
        let elem = findElement(element);
        if (elem === null) {
          throw new Error('Element not found');
        }
        elem.focus();
      },
      'rec:do-change': (step:ChangeStep) => {
        let { element } = step;
        console.log('do-change step', step);
        let elem = findElement(element) as HTMLInputElement;
        if (elem === null) {
          throw new Error('Element not found');
        }
        elem.value = step.value;
      },
    })

    const NO_CLICK_INPUT_TYPES = ['date'];

    function isChangeOnlyElement(elem:HTMLElement):boolean {
      if (elem.tagName === 'SELECT') {
        return true;
      } else if (elem.tagName === 'INPUT') {
        let type = elem.getAttribute('type').toLowerCase();
        if (NO_CLICK_INPUT_TYPES.indexOf(type) !== -1) {
          return true;
        }
      }
      return false;
    }

    window.addEventListener('change', (ev:any) => {
      let target = ev.target;
      if (isChangeOnlyElement(target)) {
        let step:ChangeStep = {
          type: 'change',
          element: identifyElement(target),
          value: target.value,
        }
        this.rpc.call('rec:step', step);
      }
    })

    window.addEventListener('click', (ev:any) => {
      if (isChangeOnlyElement(ev.target)) {
        let step:FocusStep = {
          type: 'focus',
          element: identifyElement(ev.target),
        }
        this.rpc.call('rec:step', step);
        return;
      }
      console.log('click ev', ev);
      let {pageX, pageY, screenX, screenY} = ev;
      let rect = ev.target.getBoundingClientRect();
      let offsetX = Math.floor(ev.clientX - rect.left);
      let offsetY = Math.floor(ev.clientY - rect.top);

      if (ev.detail === 0) {
        // keyboard triggered
        let bounds = getBounds(ev.target as HTMLElement);
        pageX = bounds.x;
        pageY = bounds.y;
        offsetX = 1;
        offsetY = 1;
      }
      let step:ClickStep = {
        type: 'click',
        element: identifyElement(ev.target as HTMLElement),
        pageX,
        pageY,
        screenX,
        screenY,
        offsetX,
        offsetY,
      }
      this.rpc.call('rec:step', step);
    }, false)
    
    window.addEventListener('keydown', (ev) => {
      let step:KeyPressStep = {
        type: 'keypress',
        element: identifyElement(ev.target as HTMLElement),
        keys: [{
          key: ev.key,
          modifiers: eventToKeyModifiers(ev),
        }]
      }
      this.rpc.call('rec:step', step);
    }, false);

    this.rpc.call('rec:ready-for-control');
  }
}

//-----------------------------------------------------------
// in-host container RecordingDirector
//-----------------------------------------------------------
export class RecordingDirector extends EventEmitter {
  public is_recording = false;
  public is_playing = false;

  public current_recording:Recording;
  public step_index:number = 0;
  public poll_interval:number = 100;
  public playback_delay:number = 120;
  public typing_delay:number = 20;

  private rpc:RPC;
  private pages_loaded:Array<{
    title: string;
    url: string;
  }> = [];

  constructor(readonly webview:Electron.WebviewTag) {
    super();
    this.current_recording = new Recording();
    this.rpc = inHostRPC(webview);
    this.rpc.addHandlers({
      'rec:step': (step:RecStep) => {
        if (this.is_recording) {
          this.current_recording.addStep(step);
          this.emit('recorded-step', step);
        }
      },
      'rec:ready-for-control': () => {
        this.emit('child-ready-for-control');
      }
    })
    webview.addEventListener('will-navigate', (ev) => {
      if (this.is_recording) {
        let pageload:PageLoadStep = {
          type: 'pageload',
        }
        this.current_recording.addStep(pageload);
      } else if (this.is_playing) {
        this.pages_loaded.push({
          title: webview.getTitle(),
          url: webview.getURL(),
        })
        this.emit('pageloaded');
      }
    })
  }
  setURL(url:string) {
    this.current_recording.steps.unshift({
      type: 'navigate',
      url,
    });
  }
  startRecording() {
    this.is_recording = true;
    this.is_playing = false;
  }
  pauseRecording() {
    this.is_recording = false;
  }

  // playback
  async play(rec?:Recording) {
    this.current_recording = rec || this.current_recording;
    this.step_index = 0;
    this.is_playing = true;
    this.is_recording = false;
    let steps = this.current_recording.steps;
    for (this.step_index = 0; this.step_index < steps.length; this.step_index++) {
      console.log('doing step', this.step_index);
      this.emit('start-step', this.step_index);
      await this.doStep(steps[this.step_index]);
      await wait(this.playback_delay);
      this.emit('finish-step', this.step_index);
    }
  }
  async doStep(step:RecStep) {
    switch (step.type) {
      case 'navigate': {
        return this._doNavigateStep(step);
      }
      case 'pageload': {
        return this._doPageLoadStep(step);
      }
      case 'click': {
        return this._doClickStep(step);
      }
      case 'focus': {
        return this._doFocusStep(step);
      }
      case 'change': {
        return this._doChangeStep(step);
      }
      case 'keypress': {
        return this._doKeyPressStep(step);
      }
      default: {
        break;
      }
    }
  }
  async _doNavigateStep(step:NavigateStep) {
    return new Promise((resolve, reject) => {
      let wc = this.webview.getWebContents();
      this.once('child-ready-for-control', ev => {
        resolve(null);
      })
      wc.loadURL(step.url);
    })
  }
  async getBoundsFromRemote(elem:UniqueElementID):Promise<IBounds> {
    while (true) {
      // XXX add a timeout
      let bounds = await this.rpc.call<IBounds>('getbounds', {element: elem});
      if (bounds !== null) {
        return bounds;
      }
      await wait(this.poll_interval);
    }
  }
  async _doClickStep(step:ClickStep) {
    console.log('sending click');
    let bounds = await this.getBoundsFromRemote(step.element)
    let x = bounds.x + step.offsetX;
    let y = bounds.y + step.offsetY;
    sendClick(this.webview, {
      x,
      y,
      globalX: step.screenX,
      globalY: step.screenY,
    })
  }
  async _doKeyPressStep(step:KeyPressStep) {
    for (var i = 0; i < step.keys.length; i++) {
      let item = step.keys[i];
      console.log("sending key", item.key);
      await sendKey(this.webview, item.key, item.modifiers);
      await wait(this.typing_delay);
    }
  }
  async _doChangeStep(step:ChangeStep) {
    return this.rpc.call('rec:do-change', step);
  }
  async _doFocusStep(step:FocusStep) {
    return this.rpc.call('rec:do-focus', step);
  }
  async _doPageLoadStep(step:PageLoadStep) {
    if (this.pages_loaded.length) {
      // already started
      console.log('page load already started');
      this.pages_loaded.shift();
    } else {
      console.log('waiting for page to load');
      return new Promise((resolve, reject) => {
        this.once('pageloaded', ev => {
          console.log('page load started');
          resolve(ev);
        })
      })
    }
  }
}


//-----------------------------------------------------------
// Input Events
//-----------------------------------------------------------
function eventKeyToKeyCode(key:string) {
  switch (key) {
    case 'Enter': return '\u000d'
    case 'Tab': return '\u0009'
    case 'Backspace': return '\u0008'
  }
  return key;
}

function eventToKeyModifiers(ev:any):string[] {
  let ret = [];
  if (ev.shiftKey) {
    ret.push('Shift');
  }
  if (ev.metaKey) {
    ret.push('Command');
  }
  if (ev.ctrlKey) {
    ret.push('Control');
  }
  if (ev.altKey) {
    ret.push('Alt');
  }
  return ret;
}

function doesKeyRequireDownAndUp(key:string):boolean {
  switch (key) {
    case 'Backspace':
    case 'Enter': {
      return true;
    }
  }
  return false;
}
function doesKeyRequireDownOnly(key:string):boolean {
  switch (key) {
    case 'Tab': {
      return true;
    }
  }
  return false;
}

function sendKey(webview:Electron.WebviewTag, key:string, modifiers?:string[]) {
  let keyCode = eventKeyToKeyCode(key);
  let data:any = {
    type: 'char',
    keyCode: keyCode,
  }
  if (modifiers) {
    data.modifiers = modifiers;
  }
  if (doesKeyRequireDownAndUp(key)) {
    console.log("down and up");
    let keydown = Object.assign({}, data, {type: 'keyDown'})
    let keyup = Object.assign({}, data, {type: 'keyUp'});
    webview.sendInputEvent(keydown);
    webview.sendInputEvent(keyup);
  } else if (doesKeyRequireDownOnly(key)) {
    console.log("just down");
    let keydown = Object.assign({}, data, {type: 'keyDown'})
    webview.sendInputEvent(keydown);
  }
  webview.sendInputEvent(data)
}

function sendClick(webview:Electron.WebviewTag, pos:{x:number, y:number, globalX:number, globalY:number}) {
  let send = {
    type: 'mouseDown',
    x: pos.x,
    y: pos.y,
    // globalX: pos.globalX,
    // globalY: pos.globalY,
    clickCount: 1,
    button: 'left',
  };
  webview.sendInputEvent(send)
  webview.sendInputEvent({
    type: 'mouseUp',
    x: pos.x,
    y: pos.y,
    // globalX: pos.globalX,
    // globalY: pos.globalY,
  })
}

