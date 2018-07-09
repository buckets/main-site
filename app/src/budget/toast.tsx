import * as React from 'react'
import * as cx from 'classnames'
import { CSSTransition, TransitionGroup } from 'react-transition-group'


class Toast {
  public message: string;
  public duration: number = 8000;
  public className?: string;
  public id: number;
  static IDS: number = 0;
  private _timer;
  constructor(private toaster:Toaster) {
    this.id = Toast.IDS++;
  }
  close() {
    this.toaster.removeToast(this);
    if (this._timer) {
      clearTimeout(this._timer);
    }
  }
  start() {
    this._timer = setTimeout(() => {
      this._timer = null;
      this.close();
    }, this.duration);
  }
}

interface ToastArgs {
  duration?:number;
  className?:string;
}
type MessageOrFunc = string | ((x:any)=>string);

interface MultiMessage {
  message: string;
  error?: MessageOrFunc;
  success?: MessageOrFunc;
}
export function isMultiMessage(obj): obj is MultiMessage {
  return obj.error !== undefined || obj.success !== undefined;
}

class Toaster {
  private toasts: Toast[] = [];
  public displays: ToastDisplay[] = [];
  makeToast(message:string, args?:ToastArgs, no_start?:boolean):Toast {
    let toast = new Toast(this);
    toast.message = message;
    if (args) {
      if (args.duration) {
        toast.duration = args.duration;
      }
      if (args.className) {
        toast.className = args.className;
      }
    }
    this.toasts.push(toast);
    this.updateDisplays();
    if (!no_start) {
      toast.start();
    }
    return toast;
  }
  private updateDisplays() {
    this.displays.forEach(display => {
      display.setState({toasts: this.toasts});
    })
  }
  removeToast(toast:Toast) {
    this.toasts.splice(this.toasts.indexOf(toast), 1);
    this.updateDisplays();
  }
  async makeToastDuring<T>(message:string|MultiMessage, func:((...args)=>T|Promise<T>), args?:ToastArgs):Promise<T> {
    let msg:string;
    let success:MessageOrFunc;
    let error:MessageOrFunc;
    if (isMultiMessage(message)) {
      msg = message.message;
      success = message.success;
      error = message.error;
    } else {
      msg = message;
    }
    let toast = this.makeToast(msg, args, true);
    try {
      let ret = await func();
      if (success) {
        if (typeof success === 'string') {
          toast.message = success;
        } else {
          toast.message = success(ret);
        }
        toast.className = 'success';
        toast.start();
        this.updateDisplays();
      } else {
        this.removeToast(toast);  
      }
      return ret;
    } catch(err) {
      if (error) {
        if (typeof error === 'string') {
          toast.message = error;
        } else {
          toast.message = error(err);
        }
        toast.className = 'error';
        toast.start();
        this.updateDisplays();
      } else {
        this.removeToast(toast);
      }
      throw err;
    }
  }
}

const TOASTER = new Toaster();
export const makeToast = TOASTER.makeToast.bind(TOASTER);
export const makeToastDuring = TOASTER.makeToastDuring.bind(TOASTER);


export class ToastDisplay extends React.Component<any, {toasts: Toast[]}> {
  constructor(props) {
    super(props)
    this.state = {
      toasts: [],
    }
  }
  componentWillMount() {
    TOASTER.displays.push(this);
  }
  componentWillUnmount() {
    TOASTER.displays.splice(TOASTER.displays.indexOf(this), 1);
  }
  render() {
    let items = this.state.toasts.map(toast => {
      let className = cx('toast', toast.className)
      return <CSSTransition
          key={toast.id}
          classNames="toast"
          timeout={200}>
        <div className={className}>
          <div className="message">{toast.message}</div>
          <a
            href="#"
            className="close"
            onClick={ev => {
              ev.preventDefault();
              toast.close();
            }} >&times;</a> 
        </div>
      </CSSTransition>
    })
    return <div className="toasts">
      <TransitionGroup>{items}</TransitionGroup>
    </div>
  }
}