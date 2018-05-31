
import { remote, shell } from 'electron'
import * as React from 'react'
import * as querystring from 'querystring'
import * as fs from 'fs-extra-promise'
import { sss } from '../../i18n'
import { AppState } from '../appstate'
import { Interval } from 'buckets-core/dist/time'
import { Money } from '../../money'
import { TransactionList } from '../transactions'
import { Transaction } from '../../models/account'
import { makeToast } from '../toast'
import { parseCSVStringWithHeader, csvFieldToCents } from '../../csvimport'


interface AmazonPageProps {
  appstate: AppState;
}
export class AmazonPage extends React.Component<AmazonPageProps, {
  reportset: ReportSet;
}> {
  constructor(props) {
    super(props);
    this.state = {
      reportset: {
        orders: [],
        orders_by_id: {},
        items: [],
        items_by_id: {},
        refunds: [],
        refunds_by_id: {},
      }
    }
  }
  makeItemsSection(items:Item[], appstate:AppState) {
    if (items.length) {
      return (
        <table className="ledger">
          <thead>
            <tr>
              <th className="right">{sss('Amount')}</th>
              <th>{sss('Item'/* Amazon order item description label */)}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item:Item, idx) => {
              return <tr key={idx}>
                <td className="right"><Money value={item.item_total} /></td>
                <td>{item.title}</td>
              </tr>
            })}
          </tbody>
        </table>);
    } else {
      return <div><a href="#" onClick={ev => {
            ev.preventDefault();
            openAmazonReportPage({
              range: appstateToInterval(appstate),
              type: 'ITEMS',
            })
          }}>{sss('Import an Amazon Items report to see order details.')}</a>
      </div>
    }
  }
  render() {
    let { appstate } = this.props;
    let { reportset } = this.state;
    let order_ids = Object.keys(reportset.orders_by_id);
    let orders_list;
    if (order_ids.length) {
      orders_list = order_ids.map(order_id => {
        let orders_section;
        let items_section;

        let items = reportset.items_by_id[order_id] || [];
        let orders = reportset.orders_by_id[order_id] || [];
        let matching_transactions = [];

        if (orders.length) {
          let total = 0;
          let shipping = 0;
          orders.forEach(order => {
            total += order.total_charged;
            shipping += order.shipping_charge;
          })
          orders_section = (
            <table className="props">
              <tbody>
                <tr>
                  <th>Order ID</th>
                  <td>{order_id}</td>
                </tr>
                <tr>
                  <th>Date</th>
                  <td>{[...orders, ...items][0].order_date}</td>
                </tr>
                <tr>
                  <th>Shipping</th>
                  <td><Money value={shipping}/></td>
                </tr>
                <tr>
                  <th>Total</th>
                  <td><Money value={total} /></td>
                </tr>
              </tbody>
            </table>);
          matching_transactions = Object.values<Transaction>(appstate.transactions).filter(trans => {
            return -total === trans.amount;
          })
        } else {
          orders_section = <div>
            Import an <a href="#" onClick={ev => {
                ev.preventDefault();
                openAmazonReportPage({
                  range: appstateToInterval(appstate),
                  type: 'SHIPMENTS',
                })
              }}>Amazon Orders report</a>
          </div>
        }

        items_section = this.makeItemsSection(items, appstate);

        return (<div className="record-list-item" key={order_id}>
            
            <h3>Order Summary</h3>
            {orders_section}

            <h3>Details</h3>
            {items_section}

            <h3>Matching Transaction(s)</h3>
            {matching_transactions.length === 0 ? <span>{sss('No matches found')}</span> :
            <TransactionList
              noCreate
              appstate={appstate}
              categories={appstate.categories}
              transactions={matching_transactions}
            />}
        </div>);
      });
    }
    let refunds_list;
    let refund_ids = Object.keys(reportset.refunds_by_id);
    if (refund_ids.length) {
      refunds_list = refund_ids.map(order_id => {
        let refunds = reportset.refunds_by_id[order_id] || [];
        let items = reportset.items_by_id[order_id] || [];

        let total = 0;
        refunds.forEach(refund => {
          total += refund.refund_amount;
        })
        let matching_transactions = [];
        return (<div className="record-list-item" key={order_id}>
            <h3>Refund Summary</h3>
            <table className="props">
              <tbody>
                <tr>
                  <th>Order ID</th>
                  <td>{order_id}</td>
                </tr>
                <tr>
                  <th>Date</th>
                  <td>{[...refunds, ...items][0].order_date}</td>
                </tr>
                <tr>
                  <th>Total Refund</th>
                  <td><Money value={total} /></td>
                </tr>
              </tbody>
            </table>

            <h3>Original Purchase Details</h3>
            {this.makeItemsSection(items, appstate)}

            <h3>Matching Transaction(s)</h3>
            {matching_transactions.length === 0 ? <span>{sss('No matches found')}</span> :
            <TransactionList
              noCreate
              appstate={appstate}
              categories={appstate.categories}
              transactions={matching_transactions}
            />}
          </div>)
      })
    }
    return (
      <div className="rows">
        <div className="panes">
          <div className="padded">
            <h1>{sss('Amazon.com Reconciliation')}</h1>

            <ol>
              <li>
                <a href="#" onClick={ev => {
                  ev.preventDefault();
                  openAmazonReportPage({
                    range: appstateToInterval(appstate),
                    type: 'ITEMS',
                  })
                }}>{sss('Request an Amazon Items report')}</a>
                {reportset.items.length ? <span className="fa fa-check fa-fw" /> : null}
              </li>
              <li>
                <a href="#" onClick={ev => {
                  ev.preventDefault();
                  openAmazonReportPage({
                    range: appstateToInterval(appstate),
                    type: 'SHIPMENTS',
                  })
                }}>{sss('Request an Amazon Orders report')}</a>
                {reportset.orders.length ? <span className="fa fa-check fa-fw" /> : null}
              </li>
              <li>
                <a href="#" onClick={ev => {
                  ev.preventDefault();
                  openAmazonReportPage({
                    range: appstateToInterval(appstate),
                    type: 'REFUNDS',
                  })
                }}>{sss('Optionally request a Amazon Refunds report')}</a>
                {reportset.refunds.length ? <span className="fa fa-check fa-fw" /> : null}
              </li>
              <li>
                <a href="#" onClick={ev => {
                  ev.preventDefault();
                  remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
                    defaultPath: remote.app.getPath('downloads'),
                    properties: ['openFile', 'multiSelections'],
                    filters: [
                      {name: 'CSV', extensions: ['csv']},
                    ],
                    title: 'Open Amazon.com Reports',
                  }, (filePaths:string[]) => {
                    if (filePaths) {
                      processCSVFiles(filePaths)
                      .then((result:ReportSet) => {
                        if (result.items.length) {
                          makeToast(sss('Successfully imported Amazon Items report'))
                        }
                        if (result.orders.length) {
                          makeToast(sss('Successfully imported Amazon Orders report'))
                        }
                        if (result.refunds.length) {
                          makeToast(sss('Successfully imported Amazon Refunds report'))  
                        }
                        let reportset = combineReportSets(this.state.reportset, result);
                        this.setState({
                          reportset,
                        })
                      });
                    }
                  })
                }}>{sss('Import all Amazon Reports')}</a>
              </li>
            </ol>

            {orders_list}

            {refunds_list}

          </div>
        </div>
      </div>
    )
  }
}

function appstateToInterval(appstate:AppState):Interval {
  return {
    start: appstate.viewDateRange.onOrAfter.subtract(7, 'days'),
    end: appstate.viewDateRange.before,
  }
}

function openAmazonReportPage(args:{
  type?: 'ITEMS' | 'SHIPMENTS' | 'REFUNDS' | 'RETURNS',
  range?:Interval,
}={}) {
  let qs:any = {};
  if (args.range) {
    const { start, end } = args.range;
    Object.assign(qs, {
      monthstart: start.month()+1,
      daystart: start.date(),
      yearstart: start.year(),
      monthend: end.month()+1,
      dayend: end.date(),
      yearend: end.year(),
    });
  }
  if (args.type) {
    qs.type = args.type;
  }
  shell.openExternal(`https://www.amazon.com/gp/b2b/reports?${querystring.stringify(qs)}`)
}


interface ReportSet {
  orders: Order[];
  orders_by_id: {[k:string]: Order[]};
  items: Item[];
  items_by_id: {[k:string]: Item[]};
  refunds: Refund[];
  refunds_by_id: {[k:string]: Refund[]};
}

interface Order {
  order_date: string;
  order_id: string;
  shipment_date: string;
  subtotal: number;
  shipping_charge: number;
  tax_charged: number;
  total_charged: number;
}
interface Item {
  order_date: string;
  order_id: string;
  title: string;
  asin_isbn: string;
  price_per_unit: number;
  quantity: number;
  shipment_date: string;
  item_subtotal: number;
  item_subtotal_tax: number;
  item_total: number;
}
interface Refund {
  order_date: string;
  order_id: string;
  refund_date: string;
  refund_amount: number;
  refund_tax: number;
}

async function processCSVFiles(paths:string[]):Promise<Partial<ReportSet>> {
  let ret = {
    orders: [],
    items: [],
    refunds: [],
  };
  for (const path of paths) {
    const guts = (await fs.readFileAsync(path)).toString();
    const parsed = await parseCSVStringWithHeader(guts);
    if (parsed.headers.indexOf('Refund Amount') !== -1) {
      // Refund
      ret.refunds = ret.refunds.concat(parsed.rows.map((row):Refund => {
        return {
          order_date: row['Order Date'],
          order_id: row['Order ID'],
          refund_date: row['Refund Date'],
          refund_amount: csvFieldToCents(row['Refund Amount']),
          refund_tax: csvFieldToCents(row['Refund Tax Amount']),
        }
      }))
    } else if (parsed.headers.indexOf('Item Total') !== -1) {
      // Item
      ret.items = ret.items.concat(parsed.rows.map((row):Item => {
        return {
          order_date: row['Order Date'],
          order_id: row['Order ID'],
          title: row['Title'],
          asin_isbn: row['ASIN/ISBN'],
          price_per_unit: csvFieldToCents(row['Purchase Price Per Unit']),
          quantity: Number(row['Quantity']),
          shipment_date: row['Shipment Date'],
          item_subtotal: csvFieldToCents(row['Item Subtotal']),
          item_subtotal_tax: csvFieldToCents(row['Item Subtotal Tax']),
          item_total: csvFieldToCents(row['Item Total']),
        }
      }))
    } else if (parsed.headers.indexOf('Total Charged') !== -1) {
      // Order
      ret.orders = ret.orders.concat(parsed.rows.map((row):Order => {
        return {
          order_date: row['Order Date'],
          order_id: row['Order ID'],
          shipment_date: row['Shipment Date'],
          subtotal: csvFieldToCents(row['Subtotal']),
          shipping_charge: csvFieldToCents(row['Shipping Charge']),
          tax_charged: csvFieldToCents(row['Tax Charged']),
          total_charged: csvFieldToCents(row['Total Charged']),
        }
      }))
    } else {
      // unknown
    }
  }
  return ret;
}

function mapById<T extends Order|Item|Refund>(list:Array<T>):{[k:string]:T[]} {
  let byid = {};
  list.forEach(item => {
    if (!byid[item.order_id]) {
      byid[item.order_id] = [];
    }
    byid[item.order_id].push(item);
  })
  return byid;
}

function combineReportSets(a:ReportSet, b:ReportSet):ReportSet {
  const orders = [...a.orders, ...b.orders];
  const items = [...a.items, ...b.items];
  const refunds = [...a.refunds, ...b.refunds];
  return {
    orders,
    orders_by_id: mapById(orders),
    items,
    items_by_id: mapById(items),
    refunds,
    refunds_by_id: mapById(refunds),
  }
}


