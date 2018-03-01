import * as React from 'react'
import * as cx from 'classnames'
import { IObject, TABLE2CLASS } from '../store'
import { manager } from './appstate'
import { DebouncedInput } from '../input'
import { sss } from '../i18n'

export interface INotable {
  notes: string;
}
interface NoteProps {
  obj: INotable & IObject;
}
export class NoteMaker extends React.Component<NoteProps, {
  showing: boolean;
  focused: boolean;
}> {
  constructor(props) {
    super(props)
    this.state = {
      showing: false,
      focused: false,
    }
  }
  render() {
    let { obj } = this.props;
    let button = <button
        className="icon note-icon"
        onClick={() => {
          this.setState({showing: !this.state.showing});
        }}>
        <span className={cx("fa fa-fw", {
          "fa-sticky-note": !this.state.showing,
          "fa-check": this.state.showing,
        })}/>
      </button>
    
    let guts;
    if (this.state.showing) {
      guts = <div className="note-wrap">
        <div className="note-inner">
          <DebouncedInput
            autoFocus
            value={obj.notes}
            onKeyDown={(ev) => {
              if (ev.key === 'Escape') {
                this.setState({showing: false});
              }
            }}
            onFocus={() => {
              this.setState({focused: true});
            }}
            onBlur={() => {
              this.setState({focused: false});
            }}
            onChange={(val) => {
              manager
              .checkpoint(sss('Update Note'))
              .updateObject(TABLE2CLASS[obj._type], obj.id, {notes:val} as any)
            }}
            element="textarea"
          />
          <div className="note-help">{sss('press Escape to close')}</div>
        </div>
      </div>
    }
    return <div
      className={cx("note-maker", {
        'has-note': obj.notes,
        'showing': this.state.showing,
        'focused': this.state.focused,
      })}>{button}{guts}</div>
  }
}