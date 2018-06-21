import { ISubStore, IStore } from '../store'

import { BucketStore } from './bucket'
import { AccountStore } from './account'
import { SimpleFINStore } from './simplefin'
import { ReportStore } from './reports'
import { BankMacroStore } from './bankmacro'
import * as Settings from './settings'
import { YNABStore } from './ynab'
import { PasswordFetcher } from './passwords'

export class SubStore implements ISubStore {
  constructor(private store:IStore) {
  }

  readonly fromDB = {
    settings: Settings.ISettingsObjectFromDB,
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

  private _pwfetcher:PasswordFetcher;
  get passwords() {
    if (!this._pwfetcher) {
      this._pwfetcher = new PasswordFetcher(this.store);
    }
    return this._pwfetcher;
  }
  
  private _settings:Settings.SettingsStore;
  get settings() {
    if (!this._settings) {
      this._settings = new Settings.SettingsStore(this.store);
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
