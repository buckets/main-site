import { PrefixLogger } from './logging'
import { ipcRenderer } from 'electron'
import { EventSource } from './events'
import { getBounds, IBounds } from './position'

export class DoublePlayError extends Error {}
export class TimeoutError extends Error {}

const log = new PrefixLogger('[macro]');

function compare(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;
}


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
    }).then(response => {
      return response;
    }).catch(err => {
      log.error('rpc.call error', method, err);
      throw err;
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
    
  } else if (tagName === 'a' && el.innerText) {
    return el.innerText;
  }
  let name = el.getAttribute('name');
  if (name) {
    return `<${tagName} ${name}>`;
  } else {
    return `<${tagName}>`;
  }
}

// uniquely identify an element on a page
export function identifyElement(el:HTMLElement):UniqueElementID {
  let xpaths:string[] = [];

  let tagName = el.tagName.toLowerCase();

  let id = el.getAttribute('id');
  let name = el.getAttribute('name');
  let className = el.getAttribute('class');
  let type = el.getAttribute('type');

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

  // Try all the attributes
  let attrs = Array.from(el.attributes);
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i];
    xpaths.push(`//${tagName}[@${attr.name}="${escapeQuote(attr.value)}"]`)
  }

  // Map it from the root
  xpaths.push(xpathFromRoot(el));

  if (id) {
    xpaths.push(`//${tagName}[@id="${escapeQuote(id)}"]`);
    if (name) {
      xpaths.push(`//${tagName}[@id="${escapeQuote(id)}" and @name="${escapeQuote(name)}"]`);
    }
  }

  xpaths = xpaths.filter(isXpathUnique);
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
  try {
    let iter = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    iter.iterateNext();
    let second = iter.iterateNext();
    return second === null;  
  } catch(err) {
    console.log("isXpathUnique error", err);
    return false;
  }
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

export type TabRecStep = RecStep & TabStep;

interface TabStep {
  tab_id: number;
}

// navigate
export interface NavigateStep {
  type: 'navigate';
  url: string;
}
export function isNavigateStep(x:RecStep):x is NavigateStep {
  return (<NavigateStep>x).type === 'navigate';
}

// keypress
export interface KeyPressStep  {
  type: 'keypress';
  element: UniqueElementID;
  desc: string;
  keys: Array<{
    key: string;
    modifiers: string[];
    // If true, this key signals the beginning/end of input
    input_delimiter: boolean;
  }>;
}
export function isKeyPressStep(x:RecStep):x is KeyPressStep {
  return (<KeyPressStep>x).type === 'keypress';
}

// click
export interface ClickStep  {
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
export interface FocusStep  {
  type: 'focus';
  desc: string;
  element: UniqueElementID;
}
export function isFocusStep(x:RecStep):x is FocusStep {
  return (<FocusStep>x).type === 'focus';
}

// change
export interface ChangeStep  {
  type: 'change';
  desc: string;
  element: UniqueElementID;
  value: any;
  selectedIndex?: number;
  displayValue?: string;
  isPassword: boolean;

  // Application-specific options to be used in playback
  options?: object;
}
export function isChangeStep(x:RecStep):x is ChangeStep {
  return (<ChangeStep>x).type === 'change';
}

// pageload
export interface PageLoadStep  {
  type: 'pageload';
  url: string;
}
export function isPageLoadStep(x:RecStep):x is PageLoadStep {
  return (<PageLoadStep>x).type === 'pageload';
}

// download
export interface DownloadStep  {
  type: 'download';
}
export function isDownloadStep(x:RecStep):x is DownloadStep {
  return (<DownloadStep>x).type === 'download';
}

export class Recording {
  public steps:Array<TabRecStep> = [];

  removeStep(step:TabRecStep) {
    let idx = this.steps.indexOf(step);
    this.steps.splice(idx, 1);
  }

  addStep(step:TabRecStep) {
    log.info('addStep', step.type);
    if (this.steps.length === 0) {
      this.steps.push(step)
      return;
    }

    // swap Enter/Tab change
    if (isChangeStep(step)) {
      let last_step = this.steps.slice(-1)[0];
      if (isKeyPressStep(last_step)
        && (last_step.keys[0].key === 'Enter'
          || last_step.keys[0].key === 'Tab')) {
        // stick the change before the Enter/Tab
        this.steps.splice(this.steps.length-1, 0, step);
        return;
      }
    }

    // combine keypresses into a single step
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
  clear() {
    this.steps = [];
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
    const logger = log.child('(Recorder)')
    logger.info('init');
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
      'rec:elementPresent': (params:{element:UniqueElementID}) => {
        try {
          let elem = findElement(params.element);
          if (elem === null) {
            return false;
          } else {
            return true;
          }
        } catch(err) {
          return false;
        }
      },
      'rec:do-focus': (step:FocusStep) => {
        let { element } = step;
        let elem = findElement(element);
        if (elem === null) {
          throw new Error('Element not found');
        }
        elem.scrollIntoView();
        elem.focus();
      },
      'rec:do-change': ({step, value}:{step:ChangeStep, value:string}) => {
        let { element } = step;
        let elem = findElement(element) as HTMLInputElement;
        if (elem === null) {
          throw new Error('Element not found');
        }
        elem.value = value;
        elem.focus();
      },
    })
    ipcRenderer.on('buckets:file-downloaded', (ev, {localpath, filename, mimetype}) => {
      logger.info('file downloaded', localpath, filename, mimetype);
      let step:DownloadStep = {
        type: 'download',
      }
      this.rpc.call('rec:step', step);
    })

    function isInputElement(elem:HTMLElement):boolean {
      switch (elem.tagName) {
        case 'SELECT':
        case 'OPTION':
        case 'INPUT':
        case 'TEXTAREA':
        case 'BUTTON': {
          return true;
        }
        default: {
          return false;
        }
      }
    }

    function shouldRecordFocusInsteadOfClick(elem:HTMLElement):boolean {
      switch (elem.tagName) {
        case 'SELECT':
        case 'OPTION': {
          return true;
        }
        case 'INPUT': {
          let type = elem.getAttribute('type');
          switch (type) {
            case 'date': {
              return true
            }
          }
        }
      }
      return false;
    }

    window.addEventListener('change', (ev:any) => {
      let target = ev.target;
      if (target.tagName === undefined) {
        return;
      }
      let displayValue = target.tagName === 'SELECT' ? target.children[target.selectedIndex].innerText : undefined;
      let input_type = target.getAttribute('type');
      let value = target.value;
      if (input_type === 'checkbox') {
        value = target.checked;
        displayValue = value;
      } else if (input_type === 'hidden') {
        return;
      }
      let step:ChangeStep = {
        type: 'change',
        desc: describeElement(target),
        element: identifyElement(target),
        value,
        isPassword: input_type === 'password',
        selectedIndex: target.selectedIndex,
        displayValue,
      }
      this.rpc.call('rec:step', step);
    }, {
      capture: true,
      passive: true,
    } as any)

    window.addEventListener('focus', (ev:any) => {
      if (ev.target.tagName === undefined) {
        return;
      }
      const desc = describeElement(ev.target)
      let step:FocusStep = {
        type: 'focus',
        desc: desc,
        element: identifyElement(ev.target),
      }
      this.rpc.call('rec:step', step);
    }, {
      capture: true,
      passive: true,
    } as any)

    window.addEventListener('click', (ev:any) => {
      if (ev.target.tagName === undefined) {
        return;
      }
      if (shouldRecordFocusInsteadOfClick(ev.target)) {
        let step:FocusStep = {
          type: 'focus',
          element: identifyElement(ev.target),
          desc: describeElement(ev.target),
        }
        this.rpc.call('rec:step', step);
        return;
      }

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
      let elem = ev.target as HTMLElement;
      let input_delimiter = false;
      switch (ev.key) {
        case 'Dead':
        case 'Alt':
        case 'Control':
        case 'Shift':
        case 'Meta': {
          // don't send these
          return;
        }
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
      }

      if (isInputElement(elem) && !input_delimiter) {
        // supress normal keys inside an input since we'll get them with the change event
        return;
      }

      // record the keypress
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
interface ITab {
  id: number,
  webview: Electron.WebviewTag,
  rpc: RPC,
  init_url?: string,
  pages_loaded: Array<{
    title: string;
    url: string;
  }>,
}
export class RecordingDirector<T> {
  private _state:'idle'|'recording'|'playing' = 'idle';

  private next_tab_id = 0;
  public tabs:{[id:number]: ITab} = {};

  // The currently used Recording.  Used for playback
  // and for recording.
  public current_recording:Recording;

  
  private STEP_TIMEOUT = 30000;
  public step_index:number = 0;
  public poll_interval:number = 100;
  public playback_delay:number = 120;
  public typing_delay:number = 20;

  private busy:boolean = false;
  private keepplaying:boolean = true;

  readonly events = {
    change: new EventSource<boolean>(),
    child_ready_for_control: new EventSource<number>(),
    page_loaded: new EventSource<number>(),
    step_started: new EventSource<{
      step_number: number,
    }>(),
    step_finished: new EventSource<{
      step_number: number,
    }>(),
  }

  constructor(args: {
    recording?:Recording;
  }) {
    this.current_recording = args.recording || new Recording();
    this.createTab();
  }
  clear() {
    this.current_recording.clear();
    this.next_tab_id = 1;
    this.tabs = {0: this.tabs[0]}
    this.step_index = 0;
    this.busy = false;
    this.keepplaying = true;
    this.tab_list.forEach(tab => {
      tab.pages_loaded = [];
    })
    this.emitChange();
  }
  emitChange() {
    this.events.change.emit(true);
  }
  createTab(url?:string) {
    let tab_id = this.next_tab_id++;
    this.tabs[tab_id] = {
      id: tab_id,
      rpc: null,
      init_url: url,
      webview: null,
      pages_loaded: [],
    }
    this.emitChange();
  }
  get tab_list():ITab[] {
    return Object.values<ITab>(this.tabs)
      .sort((a, b) => compare(a.id, b.id));
  }
  attachWebview(tab_id:number, webview:Electron.WebviewTag) {
    let logger = log.child(`webview${tab_id}`);
    let tab = this.tabs[tab_id];
    tab.webview = webview;
    tab.rpc = inHostRPC(webview);
    tab.pages_loaded = [];
    logger.info('attached');

    if (tab.init_url) {
      logger.info('navigating to init_url');
      webview.src = tab.init_url;
    }
    
    tab.rpc.addHandlers({
      'rec:step': (step:RecStep) => {
        logger.debug(`rec:step state=${this.state} type=${step.type}`);
        let tab_step:TabRecStep = Object.assign(step, {
          tab_id
        })
        if (this.state === 'recording') {
          this.current_recording.addStep(tab_step);
          this.emitChange();
        }
      },
      'rec:ready-for-control': () => {
        this.events.child_ready_for_control.emit(tab_id);
      }
    })
    webview.addEventListener('dom-ready', (ev) => {
      if (this.state === 'recording') {
        let pageload:PageLoadStep&TabStep = {
          tab_id,
          type: 'pageload',
          url: webview.getURL(),
        }
        this.current_recording.addStep(pageload);  
        this.emitChange();
      } else if (this.state === 'playing') {
        tab.pages_loaded.push({
          title: webview.getTitle(),
          url: webview.getURL(),
        })
        this.events.page_loaded.emit(tab_id);
      }
    })
    webview.addEventListener('new-window', ev => {
      logger.info(`request for new window disposition=${ev.disposition} frameName=${ev.frameName}`);
      this.createTab(ev.url);
    })
    webview.addEventListener('close', ev => {
      logger.info(`request to close`);
    })
  }
  get state() {
    return this._state;
  }
  setURL(tab_id:number, url:string) {
    let step:NavigateStep&TabStep = {
      tab_id,
      type: 'navigate',
      url,
    }
    if (this.current_recording.steps.length) {
      this.current_recording.addStep(step)
    } else {
      this.current_recording.steps.unshift(step);
    }
    this.emitChange();
  }

  pause() {
    if (this._state === 'recording') {
      this.pauseRecording();
    } else if (this._state === 'playing') {
      this.pausePlayback();
    }
  }


  startRecording() {
    this._state = 'recording';
    this.emitChange();
  }
  pauseRecording() {
    this._state = 'idle';
    this.emitChange();
  }
  rewind() {
    this.step_index = 0;
    this.next_tab_id = 1;
    this.tabs = {0: this.tabs[0]};
    this.emitChange();
  }

  getCurrentStep():TabRecStep {
    try {
      return this.current_recording.steps[this.step_index];
    } catch(err) {
      return null;
    }
  }

  // playback
  async play(lookUpValue:(options:T)=>any) {
    this.step_index = 0;
    return this.resumePlayback(lookUpValue);
  }
  pausePlayback() {
    this.keepplaying = false;
  }
  backOneStep() {
    if (this._state === 'idle') {
      this.step_index--;
      if (this.step_index <= 0) {
        this.step_index = 0;
      }
    }
  }
  async resumePlayback(lookUpValue:(options:T)=>any) {
    this._state = 'playing';
    this.keepplaying = true;
    this.emitChange();

    while(this.keepplaying) {
      if (!await this.playNextStep(lookUpValue)) {
        break;
      } else {
        await wait(this.playback_delay);
      }
    }
    this._state = 'idle';
    this.emitChange();
  }
  async playNextStep(lookUpValue?:(options:T)=>any) {
    if (this.busy) {
      throw new DoublePlayError('Attemped playing of step while busy');
    }
    this.busy = true;
    let steps = this.current_recording.steps;
    if (this.step_index === steps.length) {
      this.busy = false;
      return false;
    }
    let step = steps[this.step_index];
    log.info(`doing step#${this.step_index} tab#${step.tab_id} ${step.type} `);
    
    this.events.step_started.emit({step_number: this.step_index});
    
    let prior_state = this._state;
    this._state = 'playing';
    try {
      await this.doStep(step, lookUpValue);  
    } catch(err) {
      if (err instanceof TimeoutError) {
        log.error(`Timed out: step#${this.step_index} tab#${step.tab_id} ${step.type}`);
      } else {
        log.error(`Error on step#${this.step_index} tab#${step.tab_id} ${step.type} ${err}`);
        log.error(err.stack);  
      }
      this.pausePlayback();
      this.busy = false;
      throw err;
    }
    
    // Wait for all pages to load
    for (let tab of this.tab_list) {
      while (tab.webview.isLoading()) {
        await wait(this.poll_interval);
      }
    }

    this._state = prior_state;
    this.events.step_finished.emit({step_number: this.step_index});

    log.debug(`done #${this.step_index} tab#${step.tab_id} ${step.type}`);

    this.step_index++;
    this.busy = false;
    return true;
  }
  async doStep(step:TabRecStep, lookUpValue:(options:T)=>any) {
    if ((step as any).element !== undefined) {
      await this._waitForElement(step.tab_id, (step as any).element);
    }
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
        return this._doChangeStep(step, lookUpValue);
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
  /**
   *  Wait for an element to exist on the page
   */
  private async _waitForElement(tab_id:number, elem:UniqueElementID, timeout:number=30000):Promise<boolean> {
    let keepgoing = true;
    let timer = setTimeout(() => {
      keepgoing = false;
    }, timeout);
    while (keepgoing) {
      if (await this.tabs[tab_id].rpc.call<boolean>('rec:elementPresent', {
        element: elem,
      })) {
        clearTimeout(timer);
        return true;
      }
    }
    return false;
  }
  private async _doNavigateStep(step:NavigateStep&TabStep) {
    return new Promise((resolve, reject) => {
      let timer = setTimeout(() => {
        reject(new TimeoutError());
        timer = null;
      }, this.STEP_TIMEOUT);

      let { webview } = this.tabs[step.tab_id];
      this.events.child_ready_for_control.onceSuccessfully(tab_id => {
        log.debug('got child_ready_for_control', tab_id, step.tab_id);
        if (tab_id === step.tab_id) {
          if (timer) {
            clearTimeout(timer);
            resolve(null);  
          }
          return true;
        } else {
          return false;
        }
      })
      try {
        let wc = webview.getWebContents();
        wc.loadURL(step.url);
      } catch(err) {
        webview.src = step.url;
      }
    })
  }
  async getBoundsFromRemote(tab_id:number, elem:UniqueElementID):Promise<IBounds> {
    while (true) {
      // XXX add a timeout
      let bounds = await this.tabs[tab_id].rpc.call<IBounds>('getbounds', {element: elem});
      if (bounds !== null) {
        return bounds;
      }
      await wait(this.poll_interval);
    }
  }
  private async _doClickStep(step:ClickStep&TabStep) {
    let bounds = await this.getBoundsFromRemote(step.tab_id, step.element);
    log.debug('bounds for', step.desc, bounds);
    let x = bounds.x + step.offsetX;
    let y = bounds.y + step.offsetY;
    let { webview } = this.tabs[step.tab_id];
    sendClick(webview, {
      x,
      y,
      globalX: step.screenX,
      globalY: step.screenY,
    })
  }
  private async _doKeyPressStep(step:KeyPressStep&TabStep) {
    let { webview } = this.tabs[step.tab_id];
    for (var i = 0; i < step.keys.length; i++) {
      let item = step.keys[i];
      await sendKey(webview, item.key, item.modifiers);
      await wait(this.typing_delay);
    }
  }
  private async _doChangeStep(step:ChangeStep&TabStep, lookUpValue:(options:T)=>any) {
    let { rpc } = this.tabs[step.tab_id];
    let value = step.value;
    if (step.options) {
      value = lookUpValue(step.options as any);
    }
    return rpc.call('rec:do-change', {step, value});
  }
  private async _doFocusStep(step:FocusStep&TabStep) {
    let { rpc } = this.tabs[step.tab_id];
    return rpc.call('rec:do-focus', step);
  }
  private async _doPageLoadStep(step:PageLoadStep&TabStep) {
    // waiting for pages to load is already part of the playback process
  }
  private async _doDownloadStep(step:DownloadStep&TabStep) {
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
    let keydown = Object.assign({}, data, {type: 'keyDown'})
    let keyup = Object.assign({}, data, {type: 'keyUp'});
    webview.sendInputEvent(keydown);
    webview.sendInputEvent(keyup);
  } else if (doesKeyRequireDownOnly(key)) {
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
  log.debug('sending click', send);
  webview.sendInputEvent(send)
  webview.sendInputEvent({
    type: 'mouseUp',
    x: pos.x,
    y: pos.y,
    // globalX: pos.globalX,
    // globalY: pos.globalY,
  })
}

