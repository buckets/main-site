import * as React from 'react'
import * as cx from 'classnames'
import { pageCoords, dimensions } from './position'

export class Help extends React.Component<{icon:any}, {
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
    let icon = this.props.icon ? this.props.icon : '?';
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
  left: number;
  top: number;
}> {
  elem: HTMLElement = null;
  constructor(props) {
    super(props)
    this.state = {
      showing: false,
      contents: '',
      left: 0,
      top: 0,
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
      style={{
        top: this.state.top,
        left: this.state.left,
      }}
      ref={(elem) => {
        if (elem) {
          this.elem = elem;
        }
      }}>{this.state.contents}</div>
  }

  static display:TooltipDisplay;
  static show(element, contents) {
    let anchor_coords = pageCoords(element);
    let anchor_dims = dimensions(element);

    TooltipDisplay.display.setState({
      showing: true,
      contents: contents,
      top: anchor_coords.y,
      left: anchor_coords.x + anchor_dims.w,
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