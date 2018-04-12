import * as React from 'react'
import { sss } from '../../i18n'
import { AppState, manager } from '../appstate'
import { LeftoverTrans } from '../../ynab'

import { TransactionList } from '../transactions'

import { PrefixLogger } from '../../logging'
// const log = new PrefixLogger('ynabimport');

interface YNABImportPageProps {
  appstate: AppState;
}
interface YNABImportPageState {
  leftovers: Array<LeftoverTrans>;
}
export class YNABImportPage extends React.Component<YNABImportPageProps, YNABImportPageState> {
  constructor(props:YNABImportPageProps) {
    super(props)
    this.state = {
      leftovers: [],
    }
  }
  componentDidMount() {
    manager.nocheckpoint.sub.ynab.listLeftoverTransactions()
    .then(leftovers => {
      this.setState({leftovers: leftovers});
    })
  }
  render() {
    return <div className="padded full-width">
      <h1>{sss('YNAB4 Import')}</h1>
      <h2>Leftovers</h2>
      <TransactionList
        noCreate
        appstate={this.props.appstate}
        categories={this.props.appstate.categories}
        transactions={this.state.leftovers.map(x => x.trans)}
      />
    </div>
  }
}

