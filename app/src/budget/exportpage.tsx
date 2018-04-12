import * as React from 'react'
import * as csv from 'csv'
import * as fs from 'fs-extra-promise'
import * as moment from 'moment-timezone'
import { remote } from 'electron'
import { AppState, manager } from './appstate'
import { IStore } from '../store'
import { sss } from '../i18n'
import { submitFeedback } from '../errors'
import { makeToast } from './toast'
import { cents2decimal } from '../money'
import { localNow, DateInput } from '../time'

interface ExportPageProps {
  appstate: AppState
}
interface ExportPageState {
  reason: string;
  from_date: moment.Moment;
  to_date: moment.Moment;
}
export class ExportPage extends React.Component<ExportPageProps, ExportPageState> {
  constructor(props) {
    super(props);
    this.state = {
      reason: sss("I'm exporting data so that I can "),
      from_date: null,
      to_date: null,
    }
  }
  quickDates = (start:moment.Moment, end:moment.Moment) => {
    return (ev) => {
      ev.preventDefault();
      this.setState({
        from_date: start,
        to_date: end,
      })
    }
  }
  render() {
    let { reason } = this.state;
    const ranges = [
      {
        label: sss('daterange.all', 'All time'),
        s: null,
        e: null,
      },
      {
        label: sss('daterange.thismonth', 'This month'),
        s: localNow().startOf('month'),
        e: localNow().add(1, 'month').startOf('month'),
      },
      {
        label: sss('daterange.fromlastmonth', 'From last month'),
        s: localNow().subtract(1, 'month').startOf('month'),
        e: localNow().add(1, 'month').startOf('month'),
      },
      {
        label: sss('daterange.from2monthsago', 'From 2 months ago'),
        s: localNow().subtract(2, 'month').startOf('month'),
        e: localNow().add(1, 'month').startOf('month'),
      },
      {
        label: sss('daterange.from3monthsago', 'From 3 months ago'),
        s: localNow().subtract(3, 'month').startOf('month'),
        e: localNow().add(1, 'month').startOf('month'),
      },
    ]
    return <div className="rows">
      <div className="padded">
        <p className="instructions">
          {sss('export.why', "Perhaps what you're doing with exported data could be built into Buckets.  Mind sending a note?")}
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
        <h2>{sss('Export')}</h2>
        <table className="props">
          <tbody>
            <tr>
              <th>{sss('From')}</th>
              <td>
                <DateInput
                  value={this.state.from_date}
                  onChange={new_date => {
                    this.setState({from_date: new_date});
                  }}/>
              </td>
              <td rowSpan={100} className="top">
                {ranges.map(range => {
                  return <div key={range.label}>
                    <a href="#" onClick={this.quickDates(range.s, range.e)}>{range.label}</a>
                  </div>
                })}
              </td>
            </tr>
            <tr>
              <th>{sss('To')}</th>
              <td>
                <DateInput
                  value={this.state.to_date}
                  onChange={new_date => {
                    this.setState({to_date: new_date});
                  }}
                />
              </td>
            </tr>
            <tr>
              <th></th>
              <td>
                <button onClick={() => {
                  remote.dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow(), {
                    title: 'Export',
                    defaultPath: 'transactions.csv',
                    buttonLabel: 'Export',
                  }, (path:string) => {
                    if (path) {
                      exportTransactionsToCSV(manager.nocheckpoint, path, {

                      })
                      .then(() => {
                        makeToast(sss('File saved: ') + path);
                      })
                    }
                  })
                }}>
                  <span className="fa fa-download" /> {sss('Transactions')}
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
  onOrAfter?: moment.Moment,
  before?: moment.Moment,
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

    const data = await store.sub.accounts.exportTransactions(args);
    data.forEach(t => {
      g.write({
        id: t.t_id,
        amount: cents2decimal(t.t_amount, {
          show_sep: false,
          show_decimal: true,
        }),
        posted: t.t_posted,
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