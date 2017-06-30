import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';

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
  private in_update:boolean = false;
  private in_render:boolean = false;

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
  async doUpdate(func?:Function):Promise<any> {
    if (func) {
      this.update_queue.push(func);
    }
    if (this.in_update) {
      return;
    }
    this.in_update = true;
    while (this.update_queue.length) {
      await this.update_queue.shift()();
    }
    this.in_update = false;

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
  }
}