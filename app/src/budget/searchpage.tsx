import * as React from 'react'
import { IStore } from '../store'
import { Account, Transaction as ATrans } from '../models/account'
import { Bucket, Transaction as BTrans } from '../models/bucket'
import { manager, AppState } from './appstate'
import { sss } from '../i18n'
import { DebouncedInput } from '../input'
import { DateDisplay } from '../time'
import { Money } from '../money'

interface QueryResult {
  accounts: Account[];
  atrans: ATrans[];
  buckets: Bucket[];
  btrans: BTrans[];
}
async function queryStore(store: IStore, query:string):Promise<QueryResult> {
  const params = {$query: query};
  let accounts = store.listObjects(Account, {
    where: "name LIKE '%'||$query||'%' OR notes LIKE '%'||$query||'%'",
    params,
    order: ['name', 'id'],
  })
  let atrans = store.listObjects(ATrans, {
    where: "memo LIKE '%'||$query||'%' OR notes LIKE '%'||$query||'%'",
    params,
    order: ['posted desc', 'id desc'],
  })
  let buckets = store.listObjects(Bucket, {
    where: "name LIKE '%'||$query||'%' OR notes LIKE '%'||$query||'%'",
    params,
    order: ['name', 'id'],
  })
  let btrans = store.listObjects(BTrans, {
    where: "memo LIKE '%'||$query||'%' OR notes LIKE '%'||$query||'%'",
    params,
    order: ['posted desc', 'id desc'],
  })
  return {
    accounts: await accounts,
    atrans: await atrans,
    buckets: await buckets,
    btrans: await btrans,
  }
}

export class SearchPage extends React.Component<{
  appstate: AppState;
}, {
  query: string;
  running: boolean;
  result: QueryResult;
}> {
  private min_query_len = 2;
  constructor(props) {
    super(props);
    this.state = {
      query: '',
      running: false,
      result: {
        accounts: [],
        atrans: [],
        buckets: [],
        btrans: [],
      }
    }
  }
  async doQuery(query:string) {
    let result:QueryResult;
    if (query.length >= this.min_query_len) {
      result = await queryStore(manager.nocheckpoint, query);
    } else {
      result = {
        accounts: [],
        atrans: [],
        buckets: [],
        btrans: [],
      }
    }
    this.setState({result: result, running: false});
  }
  render() {
    let { appstate } = this.props;
    let { result, running } = this.state;

    let buckets_table;
    let accounts_table;
    let atrans_table;
    let btrans_table;

    if (result.buckets.length) {
      buckets_table = <div>
        <h2>{sss('Buckets')}</h2>
        <table className="ledger">
          <thead>
            <tr>
              <th>{sss('Bucket')}</th>
              <th>{sss('Note')}</th>
            </tr>
          </thead>
          <tbody>
            {result.buckets.map(bucket => {
              return <tr key={bucket.id}>
                <td>{bucket.name}</td>
                <td>{bucket.notes}</td>
              </tr>
            })}
          </tbody>
        </table>
        </div>
    }

    if (result.accounts.length) {
      accounts_table = 
      <div>
        <h2>{sss('Accounts')}</h2>
        <table className="ledger">
          <thead>
            <tr>
              <th>{sss('Account')}</th>
              <th>{sss('Note')}</th>
            </tr>
          </thead>
          <tbody>
            {result.accounts.map(account => {
              return <tr key={account.id}>
                <td>{account.name}</td>
                <td>{account.notes}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    }

    if (result.atrans.length) {
      atrans_table = 
        <div>
          <h2>{sss('Account Transactions')}</h2>
          <table className="ledger">
            <thead>
              <tr>
                <th>{sss('Posted')}</th>
                <th>{sss('Account')}</th>
                <th>{sss('Memo')}</th>
                <th>{sss('Amount')}</th>
                <th>{sss('Note')}</th>
              </tr>
            </thead>
            <tbody>
              {result.atrans.map(trans => {
                return <tr key={trans.id}>
                  <td className="nobr"><DateDisplay value={trans.posted} /></td>
                  <td className="nobr">{appstate.accounts[trans.account_id].name}</td>
                  <td>{trans.memo}</td>
                  <td className="right"><Money value={trans.amount} /></td>
                  <td>{trans.notes}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
    }

    if (result.btrans.length) {
      btrans_table = 
        <div>
          <h2>{sss('Bucket Transactions')}</h2>
          <table className="ledger">
            <thead>
              <tr>
                <th>{sss('Posted')}</th>
                <th>{sss('Bucket')}</th>
                <th>{sss('Memo')}</th>
                <th>{sss('Amount')}</th>
                <th>{sss('Note')}</th>
              </tr>
            </thead>
            <tbody>
              {result.btrans.map(trans => {
                return <tr key={trans.id}>
                  <td className="nobr"><DateDisplay value={trans.posted} /></td>
                  <td className="nobr">{appstate.buckets[trans.bucket_id].name}</td>
                  <td>{trans.memo}</td>
                  <td className="right"><Money value={trans.amount} /></td>
                  <td>{trans.notes}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
    }

    let status;
    if (this.state.query.length >= this.min_query_len && !running && !accounts_table && !buckets_table && !atrans_table && !btrans_table) {
      status = <div>
        {sss('Nothing found matching:')} <code>{this.state.query}</code>
      </div>
    } else if (running) {
      status = <div>
        <span className="fa fa-refresh fa-spin"></span> {sss('Searching...')}
      </div>
    }

    return (
      <div className="rows">
        <div className="subheader">
          <div>
            {sss('Search:')} <DebouncedInput
              autoFocus
              value={this.state.query}
              onChange={val => {
                this.setState({query: val, running: true});
                this.doQuery(val);
              }}/>
          </div>
          <div>
          </div>
        </div>
        <div className="padded">
          {status}
          {accounts_table}
          {atrans_table}
          {buckets_table}
          {btrans_table}
        </div>
      </div>
    )
  }
}

