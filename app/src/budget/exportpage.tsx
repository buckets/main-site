import * as React from 'react'
import { AppState } from './appstate'

interface ExportPageProps {
  appstate: AppState
}
export class ExportPage extends React.Component<ExportPageProps, any> {
  render() {
    return <div className="rows">
      <div className="padded">
        <h2>Transactions</h2>
        <h2>Buckets</h2>
      </div>
    </div>
  }
}