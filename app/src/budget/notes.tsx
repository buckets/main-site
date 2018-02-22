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
}> {
  constructor(props) {
    super(props)
    this.state = {
      showing: false,
    }
  }
  render() {
    let { obj } = this.props;
    let button = <button
        className="icon note-icon"
        onClick={() => {
          this.setState({showing: !this.state.showing});
        }}>
        <span className="fa fa-sticky-note"/>
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
            onChange={(val) => {
              manager
              .checkpoint(sss('Update note'))
              .updateObject(TABLE2CLASS[obj._type], obj.id, {notes:val} as any)
            }}
            element="textarea"
          />
        </div>
      </div>
    }
    return <div
      className={cx("note-maker", {
        'has-note': obj.notes,
        'showing': this.state.showing,
      })}>{button}{guts}</div>
  }
}