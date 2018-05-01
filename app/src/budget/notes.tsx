import * as React from 'react'
import * as cx from 'classnames'
import { IObject, TABLE2CLASS } from '../store'
import { manager } from './appstate'
import { debounceChange } from '../input'
import { sss } from '../i18n'

export interface INotable {
  notes: string;
}
interface NoteProps {
  obj: INotable & IObject;
}
export class NoteMaker extends React.PureComponent<NoteProps, {
  showing: boolean;
  focused: boolean;
  notes: string;
}> {
  constructor(props:NoteProps) {
    super(props)
    this.state = {
      showing: false,
      focused: false,
      notes: props.obj.notes || '',
    }
  }
  componentWillReceiveProps(nextProps:NoteProps) {
    if (!this.state.focused) {
      this.setState({
        notes: nextProps.obj.notes || '',
      })
    }
  }
  save = debounceChange((newval:string) => {
    if (!newval.trim()) {
      newval = '';
    }
    manager
    .checkpoint(sss('Update Note'))
    .updateObject(TABLE2CLASS[this.props.obj._type], this.props.obj.id, {notes:newval} as any)
  })
  render() {
    let { obj } = this.props;
    let button = <button
        className="icon hover note-icon"
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
          <textarea
            autoFocus
            value={this.state.notes}
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
            onChange={(ev) => {
              const val = ev.target.value;
              this.setState({
                notes: val,
              }, () => {
                this.save(val);
              })
            }}
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
