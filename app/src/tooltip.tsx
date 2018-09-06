import * as React from 'react'
import * as cx from 'classnames'


interface HelpState {
  showing: boolean;
  method: 'click' | 'hover';
  isbottomhalf: boolean;
  isrightside: boolean;
}
export class Help extends React.Component<{
  icon?: any;
  className?: string;
}, HelpState> {
  constructor(props) {
    super(props);
    this.state = {
      showing: false,
      method: 'hover',
      isbottomhalf: false,
      isrightside: false,
    }
  }
  private el;
  setShowing = (showing:boolean, method?:'hover'|'click') => {
    let newstate:Partial<HelpState> = {showing};
    if (method) {
      newstate.method = method;
    }
    if (showing && this.el) {
      const rect = this.el.getBoundingClientRect();
      const window_height = window.innerHeight || document.documentElement.clientHeight;
      const window_width = window.innerWidth || document.documentElement.clientWidth;
      if (rect.bottom >= window_height/2) {
        newstate.isbottomhalf = true;
      }
      if (rect.right >= window_width/2) {
        newstate.isrightside = true;
      }
    }
    this.setState(newstate as any);
  }
  render() {
    let note;
    let { className } = this.props;
    let { showing, method } = this.state;
    if (showing) {
      note = <div className="note-outer"><div className="note-inner">
        <div className="note">{this.props.children}</div>
      </div></div>
    }
    let icon = this.props.icon ? this.props.icon : <span className="icon fa fa-question-circle"></span>;
    return <div
      ref={el => {
        if (el !== null) {
          this.el = el;
        }
      }}
      className={cx("help", className, {
        'showing': showing,
        'clicked-open': method === 'click',
        'show-on-left': this.state.isrightside,
        'show-on-top': this.state.isbottomhalf,
      })}
      onMouseEnter={() => {
        this.setShowing(true);
      }}
      onMouseLeave={() => {
        if (method === 'hover') {
          this.setShowing(false);
        }
      }}
      onClick={() => {
        if (method === 'hover') {
          this.setShowing(true, 'click');
        } else {
          if (showing) {
            this.setShowing(false, 'hover');
          } else {
            this.setShowing(true, 'click');
          }
        }
      }}>
      {this.state.isbottomhalf ? note : null}
      {icon}
      {this.state.isbottomhalf ? null : note}
    </div>
  }
}
