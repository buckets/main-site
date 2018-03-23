import * as React from 'react'
import * as Path from 'path'
import * as fs from 'fs-extra-promise'
import { localNow } from '../../time'
import { remote } from 'electron'
import { sss } from '../../i18n'
import { AppState, manager } from '../appstate'
import { current_file } from '../../mainprocess/files'
import { displayError } from '../../errors'

import { PrefixLogger } from '../../logging'
const log = new PrefixLogger('startover');

async function backupAndStartOver(options:{
  keep_buckets: boolean;
  keep_accounts: boolean;
  keep_bucket_transactions: boolean;
  keep_account_transactions: boolean;
}) {
  log.info('Starting over', options);
  const this_filename = await current_file.getFilename();
  const dirname = Path.dirname(this_filename);
  const basename = Path.basename(this_filename);
  const ext = Path.extname(this_filename);
  const justname = basename.slice(0, -ext.length);
  let backup_filename = Path.resolve(dirname, `${justname}_backup${localNow().format('YYYYMMDDHHmmss')}.buckets`);
  backup_filename = await new Promise<string>((resolve, reject) => {
    remote.dialog.showSaveDialog(remote.BrowserWindow.getFocusedWindow(), {
      title: sss('Create Backup'),
      defaultPath: backup_filename,
      filters: [
        {
          name: sss('budget-file-type-name', 'Buckets Budget'),
          extensions: ['buckets'],
        },
      ]
    }, filename => {
      resolve(filename)
    })
  })
  if (backup_filename === this_filename) {
    throw new Error(sss('You must backup to a different file.'))
  }
  if (!backup_filename) {
    return;
  }

  // create backup
  log.info('Copying from', this_filename, 'to', backup_filename);
  await fs.copyAsync(this_filename, backup_filename);
  log.info('Copy complete');

  // delete stuff
  const store = manager.nocheckpoint;
  if (!options.keep_account_transactions) {
    log.info('Deleting account transactions')
    await store.query('DELETE FROM account_transaction', {});
  }
  if (!options.keep_accounts) {
    log.info('Deleting accounts')
    await store.query('DELETE FROM account', {});
  }
  if (!options.keep_bucket_transactions) {
    log.info('Deleting bucket transactions')
    await store.query('DELETE FROM bucket_transaction', {});
  }
  if (!options.keep_buckets) {
    log.info('Deleting buckets');
    await store.query('DELETE FROM buckets', {});
  }
  manager.refresh();
}

interface StartOverPageProps {
  appstate: AppState;
}
interface StartOverPageState {
  keep_buckets: boolean;
  keep_accounts: boolean;
  keep_bucket_transactions: boolean;
  keep_account_transactions: boolean;
}
export class StartOverPage extends React.Component<StartOverPageProps, StartOverPageState> {
  constructor(props:StartOverPageProps) {
    super(props)
    this.state = {
      keep_buckets: true,
      keep_accounts: false,
      keep_bucket_transactions: false,
      keep_account_transactions: false,
    }
  }
  checkBoxFor(prop:keyof StartOverPageState) {
    return <input
      checked={this.state[prop]}
      onChange={ev => {
        if (ev.target.checked) {
          this.setState({
            [prop]: ev.target.checked,
          } as any)
        }
      }}
      type="checkbox" />
  }
  render() {
    return <div className="padded full-width">
      <h2>{sss('Start Over')}</h2>
      <p>
        {sss("This tool will delete data so that to make it easy to start over with your budget.")}
      </p>
      <div>
        <label>{this.checkBoxFor('keep_buckets')} {sss('Keep buckets')}</label>
      </div>
      <div>
        <label>{this.checkBoxFor('keep_accounts')} {sss('Keep accounts')}</label>
      </div>
      <div>
        <label>{this.checkBoxFor('keep_bucket_transactions')} {sss('Keep bucket transactions')}</label>
      </div>
      <div>
        <label>{this.checkBoxFor('keep_account_transactions')} {sss('Keep account transactions')}</label>
      </div>
      <p>
        <button onClick={async () => {
          try {
            await backupAndStartOver({
              keep_buckets: this.state.keep_buckets,
              keep_accounts: this.state.keep_accounts,
              keep_bucket_transactions: this.state.keep_bucket_transactions,
              keep_account_transactions: this.state.keep_account_transactions,
            })
          } catch(err) {
            displayError(err.message);
          }
        }}>{sss('Create Backup and Start Over')}</button>
      </p>
    </div>
  }
}

