import * as moment from 'moment-timezone'
import { remote, shell } from 'electron'
import * as cx from 'classnames'
import { cloneDeep } from 'lodash'
import * as React from 'react'
import * as querystring from 'querystring'
import * as fs from 'fs-extra-promise'
import { sss } from '../../i18n'
import { AppState } from '../appstate'
import { Interval } from 'buckets-core/dist/time'
import { Money } from '../../money'
import { DateDisplay } from '../../time'
import { TransactionList } from '../transactions'
import { Transaction } from 'buckets-core/dist/models/account'
import { makeToast } from '../toast'
import { DebouncedInput } from '../../input'
import { parseCSVStringWithHeader, csvFieldToCents } from '../../csvimport'


interface AmazonPageProps {
  appstate: AppState;
}
export class AmazonPage extends React.Component<AmazonPageProps, {
  reportset: ReportSet;
  orderset: OrderSet;
  query: string;
}> {
  constructor(props) {
    super(props);
    this.state = {
      query: 'Amazon',
      reportset: {
        orders: [],
        items: [],
        refunds: [],
      },
      orderset: {
        orders: [],
        refunds: [],
      }
    }
  }
  updateOrderSet(func:((oset:OrderSet)=>void)) {
    let clone = cloneDeep(this.state.orderset);
    func(clone);
    this.setState({
      orderset: clone,
    })
  }
  render() {
    let { appstate } = this.props;
    let { reportset } = this.state;

    const amazon_transactions = Object.values<Transaction>(appstate.transactions).filter(trans => {
      return trans.memo && trans.memo.toLowerCase().indexOf(this.state.query.toLowerCase()) !== -1;
    })

    const orders_list = this.state.orderset.orders.map((order, orderidx) => {
      let order_description;
      let shipment_list = order.shipments.map((shipment, shipmentidx) => {
        let indent_level = 3;
        if (order.shipments.length === 1) {
          indent_level = 2;
        }
        let item_list = shipment.items.map((item, itemidx) => {

          
          return <tr key={`${order.id}-${shipmentidx}-${itemidx}`} className="icon-hover-trigger">
            <td></td>
            <td></td>
            {indent_level === 3 ? <td></td> : null }

            <td className="nobr">
              <button
                className={cx("icon hover green-check", {
                  on: item.done,
                })}
                onClick={ev => {
                  this.updateOrderSet(oset => {
                    let newobj = oset.orders[orderidx].shipments[shipmentidx].items[itemidx];
                    newobj.done = !newobj.done;
                  })
                }}><span className="fa fa-check-circle"/></button>
              <Money value={-item.item_total} />
            </td>

            <td colSpan={4 - indent_level}>
              {item.title}
            </td>
          </tr>
        });
        let shipment_description;
        if (item_list.length === 1) {
          // Only one item in this shipment.
          shipment_description = shipment.items[0].title;
          if (order.shipments.length === 1) {
            // Only one shipment, too
            order_description = shipment_description;
          }
        } else {
          if (order.shipments.length === 1) {
            // Only one shipment, but multiple items
            return item_list
          }
        }
        return [<tr key={`${order.id}-${shipmentidx}`} className="icon-hover-trigger">
          <td></td>
          <td></td>

          <td className="nobr">
            <button
                className={cx("icon hover green-check", {
                  on: shipment.done,
                })}
                onClick={ev => {
                  this.updateOrderSet(oset => {
                    let newobj = oset.orders[orderidx].shipments[shipmentidx];
                    newobj.done = !newobj.done;
                  })
                }}><span className="fa fa-check-circle"/></button>
            <Money value={-shipment.total_charged} />
          </td>

          <td colSpan={3}>
            {sss('shipment-number', (number:number)=>`Shipment ${number}`/* Noun labeling this shipment number */)(shipmentidx+1)}: {shipment_description}
          </td>
        </tr>,
        ...(shipment.done || item_list.length === 1 ? [] : item_list)]
      })
      return <tbody key={order.id}>
        <tr className="icon-hover-trigger">
          <td className="nobr"><DateDisplay value={order.date} /></td>
          <td className="nobr">
            <button
              className={cx("icon hover green-check", {
                on: order.done,
              })}
              onClick={ev => {
                this.updateOrderSet(oset => {
                  let newobj = oset.orders[orderidx];
                  newobj.done = !newobj.done;
                })
              }}><span className="fa fa-check-circle"/></button>
            <Money value={-order.total} />
          </td>

          <td colSpan={5}>
            {sss('Order'/* Label for an Amazon order row */)} {order.id}: {order_description}
          </td>
        </tr>
        {order.done || order_description ? null : shipment_list}
      </tbody>
    })







    const refunds_list = this.state.orderset.refunds.map((refund,idx) => {
      return <tbody key={idx}>
        <tr className="icon-hover-trigger">
          <td className="nobr"><DateDisplay value={moment(refund.refund_date, 'MM/DD/YY')} /></td>
          <td className="right"><Money value={refund.refund_amount + refund.refund_tax} /></td>
          <td className="icon-button-wrap">
            <button
              className={cx("icon hover green-check", {
                on: refund.done,
              })}
              onClick={ev => {
                this.updateOrderSet(oset => {
                  let newrefund = oset.refunds[idx];
                  newrefund.done = !newrefund.done;
                })
              }}><span className="fa fa-check-circle"/></button>
          </td>
          <td>{refund.title}</td>
        </tr>
      </tbody>
    });

    // let order_ids = Object.keys(reportset.orders_by_id);
    // let orders_list = [];
    // if (order_ids.length) {
    //   orders_list = order_ids.map(order_id => {
    //     const order = reportset.orders_by_id[order_id][0];
    //     const
    //     let orders_section;
    //     let items_section;

    //     let items = reportset.items_by_order_id[order_id] || [];
    //     let orders = reportset.orders_by_id[order_id] || [];
        

    //     if (orders.length) {
    //       let total = 0;
    //       let shipping = 0;
    //       orders.forEach(order => {
    //         total += order.total_charged;
    //         shipping += order.shipping_charge;
    //       })
    //       orders_section = (
    //         <table className="props">
    //           <tbody>
    //             <tr>
    //               <th>Order ID</th>
    //               <td>{order_id}</td>
    //             </tr>
    //             <tr>
    //               <th>Date</th>
    //               <td>{[...orders, ...items][0].order_date}</td>
    //             </tr>
    //             <tr>
    //               <th>Shipping</th>
    //               <td><Money value={shipping}/></td>
    //             </tr>
    //             <tr>
    //               <th>Total</th>
    //               <td><Money value={total} /></td>
    //             </tr>
    //           </tbody>
    //         </table>);
          
    //     } else {
    //       orders_section = <div>
    //         Import an <a href="#" onClick={ev => {
    //             ev.preventDefault();
    //             openAmazonReportPage({
    //               range: appstateToInterval(appstate),
    //               type: 'SHIPMENTS',
    //             })
    //           }}>Amazon Orders report</a>
    //       </div>
    //     }

    //     items_section = this.makeItemsSection(items, appstate);

    //     return (<div className="record-list-item" key={order_id}>
            
    //         <h3>Order Summary</h3>
    //         {orders_section}

    //         <h3>Details</h3>
    //         {items_section}
    //     </div>);
    //   });
    // }
    // let refunds_list;
    // let refund_ids = Object.keys(reportset.refunds_by_order_id);
    // if (refund_ids.length) {
    //   refunds_list = refund_ids.map(order_id => {
    //     let refunds = reportset.refunds_by_order_id[order_id] || [];
    //     let items = reportset.items_by_order_id[order_id] || [];

    //     let total = 0;
    //     refunds.forEach(refund => {
    //       total += refund.refund_amount;
    //     })
    //     let amazon_transactions = [];
    //     return (<div className="record-list-item" key={order_id}>
    //         <h3>Refund Summary</h3>
    //         <table className="props">
    //           <tbody>
    //             <tr>
    //               <th>Order ID</th>
    //               <td>{order_id}</td>
    //             </tr>
    //             <tr>
    //               <th>Date</th>
    //               <td>{[...refunds, ...items][0].order_date}</td>
    //             </tr>
    //             <tr>
    //               <th>Total Refund</th>
    //               <td><Money value={total} /></td>
    //             </tr>
    //           </tbody>
    //         </table>

    //         <h3>Original Purchase Details</h3>
    //         {this.makeItemsSection(items, appstate)}

    //         <h3>Matching Transaction(s)</h3>
    //         {amazon_transactions.length === 0 ? <span>{sss('No matches found')}</span> :
    //         <TransactionList
    //           noCreate
    //           appstate={appstate}
    //           categories={appstate.categories}
    //           transactions={amazon_transactions}
    //         />}
    //       </div>)
    //   })
    // }
    return (
      <div className="layout-top-bottom-panes">
        <div className="padded">
          <h1>{sss('Amazon.com Reconciliation')}</h1>

          <ol>
            <li>
              {sss('Search for Amazon transactions:')} <DebouncedInput
                value={this.state.query}
                onChange={val => {
                  this.setState({query: val});
                }}/>
            </li>
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
              }}>{sss('Optionally request an Amazon Refunds report')}</a>
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
                        orderset: makeOrderSet(reportset),
                      })
                    });
                  }
                })
              }}>{sss('Import all Amazon Reports')}</a>
            </li>
          </ol>

          <h3>{sss('Transactions')}</h3>
          {amazon_transactions.length === 0 ? <span>{sss('No matches found')}</span> :
          <TransactionList
            noCreate
            appstate={appstate}
            categories={appstate.categories}
            transactions={amazon_transactions}
          />}
        </div>
        <div className="padded">
          <h3>{sss('Orders'/* List of orders */)}</h3>
          <table className="ledger">
            {orders_list}
          </table>
          {!orders_list.length ? sss('No orders imported') : null}

          <h3>{sss('Refunds'/* List of refunds */)}</h3>
          <table className="ledger">
            <thead>
            </thead>
            {refunds_list}
          </table>

          {!refunds_list.length ? sss('No refunds imported') : null}
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


/**
 *  Nested collection of Amazon details
 */
interface OrderSet {
  orders: Order[];
  refunds: Refund[];
}
interface Order {
  id: string;
  date: moment.Moment;
  order_id: string;
  total: number;
  shipments: Shipment[];
  done: boolean;
}
interface Shipment extends OrderRecord {
  items: Item[];
  done: boolean;
}
interface Item extends ItemRecord {
  done: boolean;
}
interface Refund extends RefundRecord {
  done: boolean;
}

function makeOrderSet(reportset:ReportSet):OrderSet {
  let orders_by_id:{[k:string]:Order} = {};
  let shipments_by_tracking_number:{[k:string]:Shipment} = {};

  reportset.orders.forEach(order_record => {
    const { order_id } = order_record;
    let shipment:Shipment = Object.assign({}, order_record, {
      items: [],
      done: false,
    });
    if (!orders_by_id[order_id]) {
      orders_by_id[order_id] = {
        id: order_id,
        done: false,
        date: null,
        order_id,
        total: 0,
        shipments: [],
      };
    }
    const order = orders_by_id[order_id];
    order.date = moment(shipment.order_date, 'MM/DD/YY');
    order.shipments.push(shipment);
    order.total += shipment.total_charged;
    shipments_by_tracking_number[shipment.tracking_number] = shipment;
  })

  reportset.items.forEach(item => {
    const { tracking_number } = item;
    const shipment = shipments_by_tracking_number[tracking_number];
    if (shipment) {
      shipment.items.push(Object.assign({}, item, {
        done: false,
      }));
    }
  })
  let orders = Object.values(orders_by_id);
  orders.reverse();
  return {
    orders,
    refunds: reportset.refunds.map(refund => {
      return Object.assign({done: false}, refund);
    })
  }
}

/**
 *  Set of Amazon records
 */
interface ReportSet {
  orders: OrderRecord[];
  items: ItemRecord[];
  refunds: RefundRecord[];
}

/**
 *  An Amazon Order CSV record
 */
interface OrderRecord {
  order_date: string;
  order_id: string;
  shipment_date: string;
  subtotal: number;
  shipping_charge: number;
  tax_charged: number;
  total_charged: number;
  tracking_number: string;
}
/**
 *  An Amazon Item CSV record
 */
interface ItemRecord {
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
  tracking_number: string;
}
/**
 *  An Amazon Refund CSV record
 */
interface RefundRecord {
  order_date: string;
  order_id: string;
  refund_date: string;
  refund_amount: number;
  refund_tax: number;
  title: string;
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
      ret.refunds = ret.refunds.concat(parsed.rows.map((row):RefundRecord => {
        return {
          order_date: row['Order Date'],
          order_id: row['Order ID'],
          refund_date: row['Refund Date'],
          refund_amount: csvFieldToCents(row['Refund Amount']),
          refund_tax: csvFieldToCents(row['Refund Tax Amount']),
          title: row['Title'],
        }
      }))
    } else if (parsed.headers.indexOf('Item Total') !== -1) {
      // Item
      ret.items = ret.items.concat(parsed.rows.map((row):ItemRecord => {
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
          tracking_number: row['Carrier Name & Tracking Number'],
        }
      }))
    } else if (parsed.headers.indexOf('Total Charged') !== -1) {
      // Order
      ret.orders = ret.orders.concat(parsed.rows.map((row):OrderRecord => {
        return {
          order_date: row['Order Date'],
          order_id: row['Order ID'],
          shipment_date: row['Shipment Date'],
          subtotal: csvFieldToCents(row['Subtotal']),
          shipping_charge: csvFieldToCents(row['Shipping Charge']),
          tax_charged: csvFieldToCents(row['Tax Charged']),
          total_charged: csvFieldToCents(row['Total Charged']),
          tracking_number: row['Carrier Name & Tracking Number'],
        }
      }))
    } else {
      // unknown
    }
  }
  return ret;
}

function combineReportSets(a:ReportSet, b:ReportSet):ReportSet {
  const orders = [...a.orders, ...b.orders];
  const items = [...a.items, ...b.items];
  const refunds = [...a.refunds, ...b.refunds];
  return {
    orders,
    items,
    refunds,
  }
}


