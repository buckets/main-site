import {IObject, IStore} from '../store';

type BucketKind =
  ''
  | 'goal';

export class Bucket implements IObject {
  static table_name: string = 'bucket';
  id: number;
  created: string;
  readonly _type: string = Bucket.table_name;
  name: string;
  notes: string;
  balance: number;
  kicked: boolean;
  group_id: number;
  ranking: string;
  kind: BucketKind;
}
export class Transaction implements IObject {
  static table_name: string = 'bucket_transaction';
  id: number;
  created: string;
  readonly _type: string = Transaction.table_name;
}



export class BucketStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async add(args?:{name:string}):Promise<Bucket> {
    let data = args || {};
    return this.store.createObject(Bucket, data);
  }
}