import * as React from 'react'
import {remote, ipcRenderer} from 'electron'
import { sss } from '../i18n'

const WC = remote.getCurrentWebContents();

export class FinderDisplay extends React.Component<{}, {
  showing: boolean;
  text: string;
  current_match: number;
  total_matches: number;
}> {
  static DISPLAYS: Set<FinderDisplay> = new Set();
  static start() {
    WC.stopFindInPage("clearSelection");
    ipcRenderer.on('find-start', () => {
      FinderDisplay.DISPLAYS.forEach(display => {
        display.open();
      })
    });
    ipcRenderer.on('find-next', () => {
      FinderDisplay.DISPLAYS.forEach(display => {
        display.findNext();
      })
    });
    ipcRenderer.on('find-prev', () => {
      FinderDisplay.DISPLAYS.forEach(display => {
        display.findPrev();
      })
    });  
    WC.on('found-in-page', (ev, result) => {
      if (result.activeMatchOrdinal === 1 && result.matches !== 1) {
        FinderDisplay.DISPLAYS.forEach(display => {
          display.findNext();
        })
      } else {
        FinderDisplay.DISPLAYS.forEach(display => {
          display.focus();
          display.setMatchNumber(result.activeMatchOrdinal, result.matches);
        })  
      }
    })
  }
  private input = null;

  constructor(props) {
    super(props)
    this.state = {
      showing: false,
      text: '',
      current_match: 0,
      total_matches: 0,
    }
  }
  open = () => {
    this.setState({
      showing: true,
    }, () => {
      document.body.addEventListener('keydown', this.watchForEscape, false);
      if (this.input) {
        this.input.focus();
        this.input.select();
      }
    })
  }
  close = () => {
    this.setState({
      showing: false,
    }, () => {
      document.body.removeEventListener('keydown', this.watchForEscape);
      WC.stopFindInPage("clearSelection");
    })
  }
  focus = () => {
    if (this.input) {
      this.input.focus()
    }
  }
  setMatchNumber = (current, total) => {
    this.setState({
      current_match: current,
      total_matches: total,
    })
  }
  watchForEscape = (ev) => {
    if (ev.key === 'Escape') {
      this.close();
    }
  }
  findNext = () => {
    if (this.state.text) {
      this.input.blur();
      WC.findInPage(this.state.text, {
        forward: true,
        findNext: true,
      })
    }
  }
  findPrev = () => {
    if (this.state.text) {
      this.input.blur();
      WC.findInPage(this.state.text, {
        forward: false,
        findNext: true,
      })
    }
  }
  changeSearch = (text) => {
    this.setState({
      text: text
    });
    if (text) {
      WC.findInPage(text);  
    } else {
      WC.stopFindInPage("keepSelection");
    }
  }
  componentWillMount() {
    FinderDisplay.DISPLAYS.add(this);
  }
  componentWillUnmount() {
    FinderDisplay.DISPLAYS.delete(this);
  }
  render() {
    if (!this.state.showing) {
      return null;
    }
    let matchcount;
    if (this.state.text) {
      matchcount = sss('match-count', (current_match:number, total_matches:number) => {
        return `${current_match} of ${total_matches}`;
      })(this.state.current_match-1, this.state.total_matches-1);
    }
    return <div className="text-finder">
      <input
        type="text"
        ref={(elem) => {
          if (elem) {
            this.input = elem;
          }
        }}
        value={this.state.text}
        onChange={ev => {
          this.changeSearch(ev.target.value);
        }} />
      <div className="matchcount-wrap">
        <div className="matchcount">{matchcount}</div>
      </div>
      <button onClick={this.findPrev}><span className="fa fa-chevron-up" /></button>
      <button onClick={this.findNext}><span className="fa fa-chevron-down" /></button>
      <button onClick={this.close}><span className="fa fa-close" /></button>
    </div>
  }
}

