import * as React from 'react'
import { sss } from '../../i18n'
import { AppState } from '../appstate'
import { Route, Switch, Link } from '../routing'

import { AmazonPage } from './amazon'
import { StartOverPage } from './startover'
import { YNABImportPage } from './ynabimport'


interface ToolsPageProps {
  appstate: AppState;
}
export class ToolsPage extends React.Component<ToolsPageProps, {}> {
  render() {
    const { appstate } = this.props;
    return <Switch>
      <Route path="/amazon">
        <AmazonPage appstate={appstate} />
      </Route>
      <Route path="/startover">
        <StartOverPage appstate={appstate} />
      </Route>
      <Route path="/ynabimport">
        <YNABImportPage appstate={appstate} />
      </Route>
      <Route path="" exact>
        <div className="tools-list">
          <Link relative to="/ynabimport"><span className="fa fa-upload"/> {sss('Import from YNAB4')}</Link>
          <Link relative to="/amazon">{sss('Amazon.com Reconciliation')}</Link>
          <Link relative to="/startover"><span className="fa fa-undo"/> {sss('Start Over')}</Link>
        </div>
      </Route>
    </Switch>
  }
}