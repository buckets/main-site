import * as React from 'react'
import * as cx from 'classnames'

export class Help extends React.Component<{
  icon?: any;
  className?: string;
}, {
  showing: boolean;
  method: 'click' | 'hover';
}> {
  constructor(props) {
    super(props);
    this.state = {
      showing: false,
      method: 'hover',
    }
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
      className={cx("help", className, {
        'showing': showing,
        'clicked-open': method === 'click',
      })}
      onMouseEnter={() => {
        this.setState({showing: true});
      }}
      onMouseLeave={() => {
        if (method === 'hover') {
          this.setState({showing: false});
        }
      }}
      onClick={() => {
        if (method === 'hover') {
          this.setState({showing: true, method: 'click'});
        } else {
          if (showing) {
            this.setState({showing: false, method: 'hover'});
          } else {
            this.setState({showing: true, method: 'click'});
          }
        }
      }}>
      {icon}
      {note}
    </div>
  }
}
