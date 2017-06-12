import {dialog} from 'electron';
import Promise from 'bluebird';
import sqlite from 'sqlite';
import {callOnce} from '../lib/promise';

export class BudgetFile {
  public windows:Array<Electron.BrowserWindow>=[];
  private _db;
  readonly filename:string;
  constructor(filename?:string) {
    this.filename = filename || '';

  }
  get db() {
    if (!this._db) {
      this._db = callOnce(() => {
        return sqlite.open(this.filename, {promise:Promise});
      })
    }
    return this._db();
  }
}

export function openDialog() {
  dialog.showOpenDialog({
    title: 'Open Buckets Budget',
  }, (paths) => {
    console.log('got paths', paths);
  })
}