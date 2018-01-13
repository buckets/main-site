import { Transaction } from '../models/account'


export function findPotentialDupes(transactions:Transaction[]):Transaction[] {
  let byAmount:{[k:number]:Transaction[]} = {};
  transactions.forEach(trans => {
    let key = `${trans.amount} ${trans.account_id}`;
    if (!byAmount[key]) {
      byAmount[key] = [];
    }
    byAmount[key].push(trans);
  })
  return Object.values<Transaction[]>(byAmount).map(translist => {
    if (translist.length > 1) {
      return translist;
    } else {
      return [];
    }
  })
  .reduce((prev, curr) => {
    return prev.concat(curr);
  }, []);
}