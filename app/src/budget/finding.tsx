import * as React from 'react'
import {remote, ipcRenderer} from 'electron'
import { sss } from '../i18n'
import * as _ from 'lodash'

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
      console.log('found-in-page', result.matches, result.activeMatchOrdinal);
      if (result.activeMatchOrdinal === 1 && result.matches !== 1) {
        // The search string itself is being matched, and there's another possible highlight.
        // move to the next one
        FinderDisplay.DISPLAYS.forEach(display => {
          display.findNext();
        })
      } else {
        // The usual case: refocus because focus gets lost
        FinderDisplay.DISPLAYS.forEach(display => {
          // console.log('refocus')
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
      console.log('stop find in page');
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
    } else {
      console.log('other key', ev);
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
      this.doSearch();
    } else {
      this.clearSearch();
    }
  }
  doSearch = _.debounce(() => {
    const { text } = this.state;
    if (text) {
      console.log('actually doing search');
      WC.findInPage(text);  
    } else {
      WC.stopFindInPage("keepSelection");
    }
  }, 250)
  clearSearch = () => {
    WC.stopFindInPage("keepSelection");
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
      let current_match = this.state.current_match - 1;
      let total_matches = this.state.total_matches - 1;
      current_match = current_match < 0 ? 0 : current_match;
      total_matches = total_matches < 0 ? 0 : total_matches;
      matchcount = sss('match-count', (current_match:number, total_matches:number) => {
        return `${current_match} of ${total_matches}`;
      })(current_match, total_matches);
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

