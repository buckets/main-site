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

// provide a human-friendly name for element
function describeElement(el:HTMLElement):string {
  let tagName = el.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'select') {
    
  } 
  let name = el.getAttribute('name');
  if (name) {
    return `<${tagName} ${name}/>`;
  } else {
    return `<${tagName}/>`;
  }
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
  | ChangeStep
  | DownloadStep


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
  desc: string;
  keys: Array<{
    key: string;
    modifiers: string[];
    input_delimiter: boolean;
  }>;

  // Name of key inside values object that accompanies playback.
  refkey?: string;
}
export function isKeyPressStep(x:RecStep):x is KeyPressStep {
  return (<KeyPressStep>x).type === 'keypress';
}

// click
export interface ClickStep {
  type: 'click';
  desc: string;
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
  desc: string;
  element: UniqueElementID;
}
export function isFocusStep(x:RecStep):x is FocusStep {
  return (<FocusStep>x).type === 'focus';
}

// change
export interface ChangeStep {
  type: 'change';
  desc: string;
  element: UniqueElementID;
  value: any;
  selectedIndex?: number;
  displayValue?: string;

  // Name of key inside values object that accompanies playback.
  refkey?: string;
}
export function isChangeStep(x:RecStep):x is ChangeStep {
  return (<ChangeStep>x).type === 'change';
}

// pageload
export interface PageLoadStep {
  type: 'pageload';
  url: string;
}
export function isPageLoadStep(x:RecStep):x is PageLoadStep {
  return (<PageLoadStep>x).type === 'pageload';
}

// download
export interface DownloadStep {
  type: 'download';
}
export function isDownloadStep(x:RecStep):x is DownloadStep {
  return (<DownloadStep>x).type === 'download';
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
      let last_step = this.steps.slice(-1)[0];
      if (isKeyPressStep(last_step)) {
        if ( !step.keys[0].input_delimiter
          && !last_step.keys.slice(-1)[0].input_delimiter) {
          // combine keypresses
          last_step.keys = last_step.keys.concat(step.keys);
          return;
        }
      }
    }
    // otherwise just add it
    this.steps.push(step);
  }
  stringify():string {
    return JSON.stringify({
      steps: this.steps,
    })
  }
  loadFromString(x:string):Recording {
    const data = JSON.parse(x);
    this.steps = data.steps;
    return this;
  }
  static parse(x:string):Recording {
    let recording = new Recording();
    return recording.loadFromString(x);
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
      'rec:do-change': ({step, value}:{step:ChangeStep, value:string}) => {
        let { element } = step;
        console.log('do-change step', step);
        let elem = findElement(element) as HTMLInputElement;
        if (elem === null) {
          throw new Error('Element not found');
        }
        elem.value = value;
      },
    })
    ipcRenderer.on('buckets:file-downloaded', (ev, {localpath, filename, mimetype}) => {
      console.log('file downloaded', localpath, filename, mimetype);
      let step:DownloadStep = {
        type: 'download',
      }
      this.rpc.call('rec:step', step);
    })
    ipcRenderer.on('buckets:will-download', (ev, {filename, mimetype}) => {
      console.log('will download', filename, mimetype);
    })

    const NO_CLICK_INPUT_TYPES = [
      'date',
      'datetime-local',
      'color',
      'month',
      'number',
      'range',
      'time',
      'week',
    ];

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
        let displayValue = target.tagName === 'SELECT' ? target.childNodes[target.selectedIndex].innerText : undefined;
        let step:ChangeStep = {
          type: 'change',
          desc: describeElement(target),
          element: identifyElement(target),
          value: target.value,
          selectedIndex: target.selectedIndex,
          displayValue,
        }
        this.rpc.call('rec:step', step);
      }
    }, {
      capture: true,
      passive: true,
    } as any)

    window.addEventListener('click', (ev:any) => {
      if (isChangeOnlyElement(ev.target)) {
        let step:FocusStep = {
          type: 'focus',
          desc: describeElement(ev.target),
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
        desc: describeElement(ev.target),
        pageX,
        pageY,
        screenX,
        screenY,
        offsetX,
        offsetY,
      }
      this.rpc.call('rec:step', step);
    }, {
      capture: true,
      passive: true,
    } as any)
    
    window.addEventListener('keydown', (ev) => {
      let input_delimiter = false;
      let elem = ev.target as HTMLElement;
      switch (ev.key) {
        case 'Enter': {
          if (elem.tagName === 'TEXTAREA') {
            input_delimiter = false;
          } else {
            input_delimiter = true;
          }
          break;
        }
        case 'Tab': {
          input_delimiter = true;
          break;
        }
        case 'Dead':
        case 'Alt':
        case 'Control':
        case 'Shift':
        case 'Meta': {
          // Don't send this
          return;
        }
      }
      let step:KeyPressStep = {
        type: 'keypress',
        desc: describeElement(ev.target as HTMLElement),
        element: identifyElement(ev.target as HTMLElement),
        keys: [{
          key: ev.key,
          modifiers: eventToKeyModifiers(ev),
          input_delimiter,
        }]
      }
      this.rpc.call('rec:step', step);
    }, {
      capture: true,
      passive: true,
    } as any);

    this.rpc.call('rec:ready-for-control');
  }
}

//-----------------------------------------------------------
/**
  RecordingDirector is used in the host page in a renderer
  process.  It knows about a `<webview>` tag which it controls
  and monitors.
*/
export class RecordingDirector extends EventEmitter {
  private _state:'idle'|'recording'|'playing' = 'idle';
  public webview:Electron.WebviewTag;

  // The currently used Recording.  Used for playback
  // and for recording.
  public current_recording:Recording;

  // Place where steps with a refkey look for values.
  public current_values:{[k:string]: any};
  
  public step_index:number = 0;
  public poll_interval:number = 100;
  public playback_delay:number = 120;
  public typing_delay:number = 20;

  private rpc:RPC;
  private pages_loaded:Array<{
    title: string;
    url: string;
  }> = [];

  constructor(args?:{
      recording?:Recording,
      values?:object,
    }) {
    super();
    args = args || {};
    this.current_recording = args.recording || new Recording();
    this.current_values = args.values || {};
  }
  attachWebview(webview:Electron.WebviewTag) {
    this.webview = webview;
    this.rpc = inHostRPC(webview);
    this.rpc.addHandlers({
      'rec:step': (step:RecStep) => {
        if (this.state === 'recording') {
          this.current_recording.addStep(step);
          this.emit('change');
        }
      },
      'rec:ready-for-control': () => {
        this.emit('child-ready-for-control');
      }
    })
    webview.addEventListener('dom-ready', (ev) => {
      console.log('dom-ready', ev);
      if (this.state === 'recording') {
        let pageload:PageLoadStep = {
          type: 'pageload',
          url: webview.getURL(),
        }
        this.current_recording.addStep(pageload);  
        this.emit('change');
      } else if (this.state === 'playing') {
        this.pages_loaded.push({
          title: webview.getTitle(),
          url: webview.getURL(),
        })
        this.emit('pageloaded');
      }
    })
    webview.addEventListener('new-window', ev => {
      // XXX there may be some site somewhere that depends on the new window actually opening in a new window...  That might be a pain to handle.
      // console.log('new window', ev);
      // webview.loadURL(ev.url);
    })
  }
  get state() {
    return this._state;
  }
  setURL(url:string) {
    this.current_recording.steps.unshift({
      type: 'navigate',
      desc: '',
      url,
    });
    this.emit('change');
  }
  startRecording() {
    this._state = 'recording';
    this.emit('change');
  }
  pauseRecording() {
    this._state = 'idle';
    this.emit('change');
  }

  // playback
  async play(values?:object, rec?:Recording) {
    this.current_values = values || this.current_values;
    this.current_recording = rec || this.current_recording;
    this.step_index = 0;
    this._state = 'playing';
    let steps = this.current_recording.steps;
    for (this.step_index = 0; this.step_index < steps.length; this.step_index++) {
      console.log('Start step', this.step_index);
      this.emit('start-step', this.step_index);
      await this.doStep(steps[this.step_index]);
      await wait(this.playback_delay);
      this.emit('finish-step', this.step_index);
      console.log('Finished step', this.step_index);

      // wait for the webview
      while (this.webview.isLoading()) {
        await wait(this.poll_interval);
      }
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
      case 'download': {
        return this._doDownloadStep(step);
      }
      default: {
        throw new Error(`Unknown step type`);
      }
    }
  }
  private async _doNavigateStep(step:NavigateStep) {
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
        console.log('got bounds', bounds);
        return bounds;
      }
      console.log('will try again for bounds');
      await wait(this.poll_interval);
    }
  }
  private async _doClickStep(step:ClickStep) {
    console.log('preparing click...');
    let bounds = await this.getBoundsFromRemote(step.element)
    let x = bounds.x + step.offsetX;
    let y = bounds.y + step.offsetY;
    console.log('sending click', x, y);
    sendClick(this.webview, {
      x,
      y,
      globalX: step.screenX,
      globalY: step.screenY,
    })
  }
  private async _doKeyPressStep(step:KeyPressStep) {
    if (step.refkey) {
      // Pull the value from the set of current values
      let value = this.current_values[step.refkey];
      for (var i = 0; i < value.length; i++) {
        let letter = value[i];
        await sendKey(this.webview, letter, []);
        await wait(this.typing_delay);
      }
    } else {
      for (var i = 0; i < step.keys.length; i++) {
        let item = step.keys[i];
        await sendKey(this.webview, item.key, item.modifiers);
        await wait(this.typing_delay);
      }
    }
  }
  private async _doChangeStep(step:ChangeStep) {
    let value = step.value;
    if (step.refkey) {
      value = this.current_values[step.refkey];
    }
    return this.rpc.call('rec:do-change', {step, value});
  }
  private async _doFocusStep(step:FocusStep) {
    return this.rpc.call('rec:do-focus', step);
  }
  private async _doPageLoadStep(step:PageLoadStep) {
    // waiting for pages to load is already part of the playback process.
    // console.log('waiting for page load...', step.url);
    // if (this.pages_loaded.length) {
    //   // already started
    //   console.log('page already loaded', this.pages_loaded);
    //   this.pages_loaded.shift();
    // } else {
    //   console.log('waiting for page to load');
    //   return new Promise((resolve, reject) => {
    //     this.once('pageloaded', ev => {
    //       console.log('page loaded');
    //       resolve(ev);
    //     })
    //   })
    // }
  }
  private async _doDownloadStep(step:DownloadStep) {

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

export function isInputValue(key:string):boolean {
  switch (key) {
    case 'Backspace':
    case 'Delete':
    case 'Insert':
    case 'Enter':
    case 'Escape':
    case 'Tab': {
      return false;
    }
  }
  return true;
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

