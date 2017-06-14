import {IObject, Store} from '../store';

type account_type = 'account'

export function isAccount(obj: IObject): obj is Account {
  return obj._type === 'account';
}
export interface Account extends IObject {
  _type: account_type;
  name: string;
  balance: number;
}

export class AccountStore {
  public store:Store;
  constructor(store:Store) {
    this.store = store;
  }
  async add(name:string) {
    return this.store.createObject('account', {
      name: name,
      balance: 0,
    })
  }
}