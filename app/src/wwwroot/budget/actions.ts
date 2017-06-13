import * as Rx from 'rxjs/Rx';
export interface IAccount {
  id: number;
  name: string;
  balance: number;
}

type DataEventType =
  'update'
  | 'delete';

type ObjectType =
  IAccount;

export class DataEvent {
  public type: DataEventType;
  public object: ObjectType;
  constructor(type:DataEventType, object:ObjectType) {
    this.type = type;
    this.object = object;
  }
}


export class Store {
  private filename:string;
  public data:Rx.Observable<IDataEvent>;

  readonly accounts:_AccountActions;
  constructor(filename) {
    this.filename = filename;
    this.data = new Rx.Subject();
    this.accounts = new _AccountActions(this);
  }
}


class _AccountActions {
  public store:Store;
  constructor(store:Store) {
    this.store = store;
  }
  add(name:string) {
    let obj:IAccount = {
      id: 0,
      name: name,
      balance: 0,
    }
    this.store.data.next(new DataEvent('update', obj));
  }
}
