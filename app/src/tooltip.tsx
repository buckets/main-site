import * as React from 'react'

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
