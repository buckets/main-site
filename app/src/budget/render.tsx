import * as ReactDOM from 'react-dom'
import * as _ from 'lodash'
import { EventSource } from 'eventsts'
import { tx } from '../i18n'

function ensureFunction<T>(x:T|(()=>T)):()=>T {
  if (_.isFunction(x)) {
    return x as (() => T);
  } else {
    return (() => x) as (() => T);
  }
}

export class Renderer {
  private render_funcs:Array<()=>Promise<any>> = [];
  private update_queue = [];
  private after_update:Array<Function> = [];
  private in_update:boolean = false;
  private in_render:boolean = false;

  readonly events = {
    renderdone: new EventSource<boolean>(),
  }

  constructor() {
    tx.localechanged.on(async ({locale}) => {
      await this.doUpdate();
    })
  }

  registerRendering(component:(JSX.Element | (()=>JSX.Element)),
    elem:(Element | (()=>Element))) {
    let component_fn = ensureFunction(component);
    let elem_fn = ensureFunction(elem);
    this.render_funcs.push(() => {
      return new Promise((resolve, reject) => {
        ReactDOM.render(component_fn(), elem_fn(), () => {
          resolve(true);
        })
      })
    })
  }
  /**
    Register a function to run after all updates.
  */
  afterUpdate(func?:Function) {
    this.after_update.push(func);
  }
  async doUpdate(func?:Function):Promise<any> {
    if (func) {
      this.update_queue.push(func);
    }
    if (this.in_render) {
      this.events.renderdone.once(() => {
        this.doUpdate(func);
      })
      return;
    }
    if (this.in_update) {
      return;
    }
    this.in_update = true;
    while (this.update_queue.length) {
      await this.update_queue.shift()();
    }
    this.in_update = false;
    for (let i = 0; i < this.after_update.length; i++) {
      await this.after_update[i]();
    }
    return this.doRender();
  }
  async doRender():Promise<any> {
    if (this.in_render) {
      return;
    }
    this.in_render = true;
    await Promise.all(this.render_funcs
      .map(func => {
        return func();
      }));
    this.in_render = false;
    this.events.renderdone.emit(true);
  }
}