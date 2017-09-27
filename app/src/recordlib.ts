import {ipcRenderer} from 'electron'
import {EventEmitter} from 'events'
import { pageCoords, dimensions } from './position'

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
export function findElement(ident:UniqueElementID):Node {
  for (var i = 0; i < ident.xpaths.length; i++) {
    let xpath = ident.xpaths[i];
    let iter = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    let first = iter.iterateNext();
    let second = iter.iterateNext();
    if (second === null) {
      return first;
    }
  }
  return null;
}

export type RecStep = ActionStep | NavigateStep | PageLoadStep;

// navigate
export interface NavigateStep {
  type: 'navigate';
  url: string;
}
export function isNavigateStep(x:RecStep):x is NavigateStep {
  return (<NavigateStep>x).type === 'navigate';
}

// action
export interface ActionStep {
  type: 'action';
  element: UniqueElementID;
}
export function isActionStep(x:RecStep):x is ActionStep {
  return (<ActionStep>x).type === 'action';
}

// keypress
export interface KeyPressActionStep extends ActionStep {
  action_type: 'keypress';
  keys: Array<{
    key: string;
    modifiers: string[];
  }>;
}
export function isKeyPressActionStep(x:ActionStep):x is KeyPressActionStep {
  return (<KeyPressActionStep>x).action_type === 'keypress';
}

// click
export interface ClickActionStep extends ActionStep {
  action_type: 'click';
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  offsetX: number;
  offsetY: number;
}
export function isClickActionStep(x:ActionStep):x is ClickActionStep {
  return (<ClickActionStep>x).action_type === 'click';
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

    if (isActionStep(step)) {
      if (isKeyPressActionStep(step)) {
        let last_step = this.steps[this.steps.length-1];
        if (isActionStep(last_step) && isKeyPressActionStep(last_step)) {
          // combine keypresses
          last_step.keys = last_step.keys.concat(step.keys);
          return;
        }
      }
    }
    // otherwise just add it
    this.steps.push(step);
  }
}

function wait(time:number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, time);
  })
}


// Use in webview
export class Recorder {
  constructor(private onAction?:(step:RecStep)=>void) {
    ipcRenderer.on('rec:dostep', (ev) => {
      console.log('dostep', ev);
    })
    ipcRenderer.on('rec:getbounds', (ev, identity:UniqueElementID) => {
      let bounds:any = {};
      try {
        let elem = findElement(identity);
        if (elem === null) {
          ipcRenderer.sendToHost('rec:gotbounds', null);
          return
        }
        Object.assign(bounds, pageCoords(elem));
        Object.assign(bounds, dimensions(elem));
        ipcRenderer.sendToHost('rec:gotbounds', bounds);
      } catch(err) {
        ipcRenderer.sendToHost('rec:gotbounds', null)
        return;
      }
    })

    // default behavior is to send to director
    if (!this.onAction) {
      this.onAction = (step) => {
        ipcRenderer.sendToHost('rec:step', step);
      }
    }

    window.addEventListener('click', (ev) => {
      console.log('click ev', ev);
      let {pageX, pageY, screenX, screenY, offsetX, offsetY} = ev;
      if (ev.detail === 0) {
        // keyboard triggered
        let coords = pageCoords(ev.target as HTMLElement);
        pageX = coords.x + 1;
        pageY = coords.y + 1;
      }
      let action:ClickActionStep = {
        type: 'action',
        element: identifyElement(ev.target as HTMLElement),
        action_type: 'click',
        pageX,
        pageY,
        screenX,
        screenY,
        offsetX,
        offsetY,
      }
      this.onAction(action);
    }, false)
    
    window.addEventListener('keydown', (ev) => {
      let action:KeyPressActionStep = {
        type: 'action',
        element: identifyElement(ev.target as HTMLElement),
        action_type: 'keypress',
        keys: [{
          key: ev.key,
          modifiers: eventToKeyModifiers(ev),
        }]
      }
      this.onAction(action);
    }, false);

    ipcRenderer.sendToHost('rec:ready-for-control');
  }
}

interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Use in renderer
export class RecordingDirector extends EventEmitter {
  public is_recording = false;
  public is_playing = false;

  public current_recording:Recording;
  public step_index:number = 0;
  public poll_interval:number = 100;
  public playback_delay:number = 120;

  private pages_loaded:Array<{
    title: string;
    url: string;
  }> = [];


  constructor(readonly webview:Electron.WebviewTag) {
    super();
    this.current_recording = new Recording();
    webview.addEventListener('ipc-message', (ev) => {
      switch (ev.channel) {
        case 'rec:ready-for-control': {
          this.emit('child-ready-for-control');
          break;
        }
        case 'rec:step': {
          let step = ev.args[0];
          if (this.is_recording) {
            this.current_recording.addStep(step);
            this.emit('recorded-step', step);
          }
          break;
        }
        case 'rec:gotbounds': {
          let bounds = ev.args[0];
          this.emit('gotbounds', bounds);
          break;
        }
        default:
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
    if (isNavigateStep(step)) {
      return this._doNavigateStep(step)
    } else if (isActionStep(step)) {
      return this._doActionStep(step);
    } else if (isPageLoadStep(step)) {
      return this._doPageLoadStep(step);
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
  async getBoundsFromRemote(elem:UniqueElementID):Promise<Bounds> {
    while (true) {
      let wc = this.webview.getWebContents();
      let bounds:Bounds = await new Promise<Bounds>((resolve, reject) => {
        this.once('gotbounds', (bounds) => {
          resolve(bounds)
        })
        wc.send('rec:getbounds', elem);
      })
      if (bounds !== null) {
        return bounds;
      }
      await wait(this.poll_interval);
    }
  }
  async _doActionStep(step:ActionStep) {
    // let wc = this.webview.getWebContents();
    if (isClickActionStep(step)) {
      console.log('sending click');
      let bounds = await this.getBoundsFromRemote(step.element)
      let x = bounds.x + 1;
      let y = bounds.y + 1;

      console.log('bounds', bounds);
      console.log('step', step);
      console.log('x', x);
      console.log('y', y);

      sendClick(this.webview, {
        x,
        y,
        globalX: step.screenX,
        globalY: step.screenY,
      })
    } else if (isKeyPressActionStep(step)) {
      // send key
      for (var i = 0; i < step.keys.length; i++) {
        let item = step.keys[i];
        console.log("sending key", item.key);
        await sendKey(this.webview, item.key, item.modifiers);
      }
    }
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
  webview.sendInputEvent(send)
  webview.sendInputEvent({
    type: 'mouseUp',
    x: pos.x,
    y: pos.y,
    // globalX: pos.globalX,
    // globalY: pos.globalY,
  })
}

