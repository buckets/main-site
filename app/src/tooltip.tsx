import * as React from 'react'
import * as cx from 'classnames'
import { pageCoords, dimensions, screenSize } from './position'

export class Help extends React.Component<{
  icon?:any;
}, {
  showing: boolean;
}> {
  constructor(props) {
    super(props);
    this.state = {
      showing: false,
    }
  }
  render() {
    let note;
    if (this.state.showing) {
      note = <div className="note-wrap">
        <div className="note">{this.props.children}</div>
      </div>
    }
    let icon = this.props.icon ? this.props.icon : <span className="fa fa-question-circle"></span>;
    return <div className="help"
      onMouseEnter={() => {
        this.setState({showing: true});
      }}
      onMouseLeave={() => {
        this.setState({showing: false});
      }}>
      {icon}
      {note}
    </div>
  }
}

export class TooltipDisplay extends React.Component<any,{
  showing: boolean;
  contents: any;
  style: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  }
}> {
  elem: HTMLElement = null;
  constructor(props) {
    super(props)
    this.state = {
      showing: false,
      contents: '',
      style: {
        left: 0,
        top: 0,  
      },
    }
  }
  componentWillMount() {
    TooltipDisplay.display = this;
  }
  componentWillUnmount() {
    TooltipDisplay.display = null;
  }
  render() {
    return <div
      className={cx('tooltip', {
        showing: this.state.showing,
      })}
      style={this.state.style}
      ref={(elem) => {
        if (elem) {
          this.elem = elem;
        }
      }}>{this.state.contents}</div>
  }

  static display:TooltipDisplay;
  static show(element, contents) {
    const anchor_coords = pageCoords(element);
    const anchor_dims = dimensions(element);
    const page_dims = screenSize();

    let style:any = {};
    if (anchor_coords.x <= page_dims.w/2) {
      // left side of screen
      style.left = anchor_coords.x + anchor_dims.w;
    } else {
      // right side of screen
      console.log('right');
    }

    if (anchor_coords.y <= page_dims.h/2) {
      // top of screen
      style.top = anchor_coords.y;
    } else {
      // bottom of screen
      console.log('bottom');
    }

    TooltipDisplay.display.setState({
      showing: true,
      contents: contents,
      style,
   })
  }
  static hide() {
    TooltipDisplay.display.setState({
      showing: false,
    })
  }
}

export function tooltip(content, existingProps?:object):object {
  return {
    onMouseEnter: (ev) => {
      TooltipDisplay.show(ev.target, content);
    },
    onMouseLeave: (ev) => {
      TooltipDisplay.hide();
    }
  }
}