import { ISubStore, IStore } from '../store'

import { BucketStore } from './bucket'
import { AccountStore } from './account'
import { SimpleFINStore } from './simplefin'
import { ReportStore } from './reports'
import { BankMacroStore } from './bankmacro'
import { SettingsStore } from './settings'
import { YNABStore } from './ynab'

export class SubStore implements ISubStore {
  constructor(private store:IStore) {
  }
  
  private _accounts:AccountStore;
  get accounts():AccountStore {
    if (!this._accounts) {
      this._accounts = new AccountStore(this.store);
    }
    return this._accounts;
  }
  
  private _buckets:BucketStore;
  get buckets() {
    if (!this._buckets) {
      this._buckets = new BucketStore(this.store);
    }
    return this._buckets;
  }
  
  private _simplefin:SimpleFINStore;
  get simplefin() {
    if (!this._simplefin) {
      this._simplefin = new SimpleFINStore(this.store);
    }
    return this._simplefin;
  }
  
  private _reports:ReportStore;
  get reports() {
    if (!this._reports) {
      this._reports = new ReportStore(this.store);
    }
    return this._reports;
  }
  
  private _bankmacro:BankMacroStore;
  get bankmacro() {
    if (!this._bankmacro) {
      this._bankmacro = new BankMacroStore(this.store);
    }
    return this._bankmacro;
  }
  
  private _settings:SettingsStore;
  get settings() {
    if (!this._settings) {
      this._settings = new SettingsStore(this.store);
    }
    return this._settings;
  }
  
  private _ynab:YNABStore;
  get ynab() {
    if (!this._ynab) {
      this._ynab = new YNABStore(this.store);
    }
    return this._ynab;
  }
}
