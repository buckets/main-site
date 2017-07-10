import * as React from 'react'
import * as cx from 'classnames'
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group'


class Toast {
  public message: string;
  public duration: number = 5000;
  public className?: string;
  public id: number;
  static IDS: number = 0;
  constructor() {
    this.id = Toast.IDS++;
  }
}

class Toaster {
  private toasts: Toast[] = [];
  public displays: ToastDisplay[] = [];
  makeToast(message:string, args?:{
    duration?:number,
    className?: string,
  }) {
    let toast = new Toast();
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
    this.displays.forEach(display => {
      display.setState({toasts: this.toasts});
    })
    setTimeout(() => {
      this.toasts.splice(this.toasts.indexOf(toast), 1);
      this.displays.forEach(display => {
        display.setState({toasts: this.toasts});
      })
    }, toast.duration);
  }
}

const TOASTER = new Toaster();
export const makeToast = TOASTER.makeToast.bind(TOASTER);


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
      return <div className={className} key={toast.id}>{toast.message}</div>
    })
    return <div className="toasts">
      <ReactCSSTransitionGroup
        transitionName="toast"
        transitionEnterTimeout={200}
        transitionLeaveTimeout={200}>
          {items}
      </ReactCSSTransitionGroup>
    </div>
  }
}