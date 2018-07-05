import { Transaction } from 'buckets-core/dist/models/account'
import { parseLocalTime } from 'buckets-core/dist/time'


export function findPotentialDupes(transactions:Transaction[], opts:{
  days?:number,
}={}):Transaction[] {
  let byAmount:{[k:number]:Transaction[]} = {};
  let days = opts.days || 3;
  let dupes = new Set<Transaction>();

  // group transactions by amount
  transactions.forEach(trans => {
    let key = `${trans.amount} ${trans.account_id}`;
    if (!byAmount[key]) {
      byAmount[key] = [];
    }
    byAmount[key].push(trans);
  })

  // go through similar amount transactions and only choose ones with a close date
  Object.values<Transaction[]>(byAmount).forEach(translist => {
    if (translist.length > 1) {
      for (const a of translist) {
        let a_posted = parseLocalTime(a.posted);
        for (const b of translist) {
          if (a === b) {
            continue;
          }
          let b_posted = parseLocalTime(b.posted);
          let diff = Math.abs(b_posted.diff(a_posted, 'days'));
          if (diff <= days) {
            dupes.add(a);
            dupes.add(b); 
          }
        }
      }
    }
  })
  return Array.from(dupes);
}