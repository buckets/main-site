import * as React from 'react'
import { sss } from '../../i18n'
import { AppState, manager } from '../appstate'
import { LeftoverTrans } from 'buckets-core/dist/models/ynab'
import { current_file } from '../../mainprocess/files'
import { ProgressBar } from '../../ui'

import { TransactionList } from '../transactions'

// import { PrefixLogger } from '../../logging'
// const log = new PrefixLogger('ynabimport');

interface YNABImportPageProps {
  appstate: AppState;
}
interface YNABImportPageState {
  leftovers: LeftoverTrans[];
  progress: number;
}
export class YNABImportPage extends React.Component<YNABImportPageProps, YNABImportPageState> {
  constructor(props:YNABImportPageProps) {
    super(props)
    this.state = {
      leftovers: null,
      progress: null,
    }
  }
  refreshLeftovers() {
    manager.nocheckpoint.sub.ynab.listLeftoverTransactions()
    .then(leftovers => {
      this.setState({leftovers: leftovers});
    })
  }
  componentDidMount() {
    this.refreshLeftovers();
    manager.nocheckpoint.events.get('ynab_import_progress').untilTrue(message => {
      if (message.error) {
        this.refreshLeftovers();
        return true;
      }
      if (message.percent >= 1) {
        setTimeout(() => {
          this.setState({progress: null});
        }, 10 * 1000)
        this.refreshLeftovers();
        return true;
      }
      this.setState({progress: message.percent});
      return false;
    })
  }
  render() {
    let leftovers;
    if (this.state.leftovers !== null) {
      leftovers = <div>
        <h2>{sss('Transactions to review')}</h2>
        <TransactionList
          noCreate
          appstate={this.props.appstate}
          categories={this.props.appstate.categories}
          transactions={this.state.leftovers.map(x => x.trans)}
        />
      </div>
    }
    return <div className="padded full-width">
      <h1><span className="fa fa-upload"/> {sss('Import from YNAB4')}</h1>
      <button onClick={() => {
        current_file.importYNAB4File();
      }}>
        <span className="fa fa-upload"/> {sss('Import file')}
      </button> {this.state.progress === null
        ? null
        : <ProgressBar
            percent={Math.ceil(100*this.state.progress)}
            width="20rem"
          />}
      {leftovers}
    </div>
  }
}

