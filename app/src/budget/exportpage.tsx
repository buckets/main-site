import * as React from 'react'
import * as csv from 'csv'
import * as fs from 'fs-extra-promise'
import { remote } from 'electron'
import { AppState, manager } from './appstate'
import { IStore } from '../store'
import { sss } from '../i18n'
import { submitFeedback } from '../errors'
import { makeToast } from './toast'
import { cents2decimal } from '../money'
import { tsfromdb } from '../time'

interface ExportPageProps {
  appstate: AppState
}
interface ExportPageState {
  reason: string;
}
export class ExportPage extends React.Component<ExportPageProps, ExportPageState> {
  constructor(props) {
    super(props);
    this.state = {
      reason: sss("I'm exporting data so that I can "),
    }
  }
  render() {
    let { reason } = this.state;
    return <div className="rows">
      <div className="padded">
        <p className="instructions">
          {sss('export.why', `Perhaps what you're doing with exported data could be built into Buckets.  Mind sending a note?`)}
        </p>
        <div className="instructions">
          <textarea
            className="paragraph"
            value={reason}
            onChange={ev => {
              this.setState({reason: ev.target.value});
            }}></textarea>
        </div>
        <div>
          <button
            onClick={() => {
              submitFeedback({
                from_email: null,
                body: `Export page feedback:\n\n${reason}`,
              }, {throwerr: true})
              .then(() => {
                makeToast(sss('Thank you for the feedback!'));
              })
              .catch(() => {

              })
            }}>
            {sss('Submit feedback')}
          </button>
        </div>
        <h2>{sss('Transactions')}</h2>
        <table className="props">
          <tbody>
            <tr>
              <th></th>
              <td>
                <button onClick={() => {
                  remote.dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow(), {
                    title: 'Export',
                    defaultPath: 'buckets_transactions.csv',
                    buttonLabel: 'Export',
                  }, (path:string) => {
                    if (path) {
                      exportTransactionsToCSV(manager.store, path, {
                      })
                      .then(() => {
                        makeToast(sss('File saved: ') + path);
                      })
                    }
                  })
                }}>
                  <span className="fa fa-download" /> {sss('Export')}
                </button>        
              </td>
            </tr>
          </tbody>
        </table>
        
      </div>
    </div>
  }
}


function exportTransactionsToCSV(store:IStore, path:string, args:{

} = {}) {
  return new Promise(async (resolve, reject) => {
    const columns = {
      'id': 'Transaction ID',
      'posted': 'Date Posted',
      'account': 'Account',
      'memo': 'Memo',
      'amount': 'Amount',
      'bt_id': 'Bucket Transaction ID',
      'bucket': 'Bucket',
      'bucket_amount': 'Bucket amount',
    }
    let g = csv.stringify({ objectMode: true, header: true, columns });
    let ws = fs.createWriteStream(path);
    g.on('end', () => {
      resolve(path);
    })
    g.on('error', (err) => {
      reject(err);
    })
    g.pipe(ws);

    const data = await store.accounts.exportTransactions();
    data.forEach(t => {
      g.write({
        id: t.t_id,
        amount: cents2decimal(t.t_amount, {
          show_sep: false,
          show_decimal: true,
        }),
        posted: tsfromdb(t.t_posted).format(),
        memo: t.t_memo,
        account: t.a_name,
        bt_id: t.bt_id,
        bucket: t.b_name,
        bucket_amount: cents2decimal(t.bt_amount, {
          show_sep: false,
          show_decimal: true,
        }),
      })
    })
    g.end();
  })
}