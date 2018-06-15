import * as moment from 'moment-timezone'
import {v4 as uuid} from 'uuid'

import { IObject, IStore } from '../store'
import { encrypt, decrypt } from '../crypto'
import { createErrorSubclass } from '../errors'
import { sss } from '@iffycan/i18n'
import { ISyncChannel, ASyncening, SyncResult } from './sync'
import { PrefixLogger } from '../logging'
import { localNow, MaybeMoment } from '../time'

const log = new PrefixLogger('(bankmacro)');

export const IncorrectPassword = createErrorSubclass('IncorrectPassword');

//-------------------------------------------------------
// Database objects
//-------------------------------------------------------
declare module '../store' {
  interface IObjectTypes {
    bank_macro: BankMacro
  }
  interface ISubStore {
    bankmacro: BankMacroStore
  }
  interface IUserInterfaceFunctions {
    /**
     *  Open a bankmacro window/browser
     */
    openBankMacroBrowser(macro_id:number, autoplay?:{
      onOrAfter: MaybeMoment;
      before: MaybeMoment;
    }):Promise<SyncResult>    
  }
}

export interface BankMacro extends IObject {
  _type: 'bank_macro';
  uuid: string;
  name: string;
  enc_recording: string;
  enabled: boolean;
  // XXX
  // static fromdb(obj:BankMacro) {
  //   obj.enabled = !!obj.enabled;
  //   return obj;
  // }
}

async function createPassword(store:IStore, pwkey:string, prompt:string):Promise<string> {
  let error;
  for (var i = 0; i < 3; i++) {
    let p1 = await store.sub.passwords.getPassword({
      pwkey: pwkey,
      prompt: prompt,
      nocache: true,
      error_message: error,
    });
    let p2 = await store.sub.passwords.getPassword({
      pwkey: pwkey,
      prompt: sss('Confirm password:'),
      nocache: true,
    })
    if (p1 === p2) {
      return p1;
    } else {
      error = sss('Passwords did not match');
    }
  }
  throw new Error(sss("Passwords did not match"));
}


export interface IUpdateArgs {
  name?: string;
  recording_str?: string;
  enabled?: boolean;
}
export interface BankMacroGuts {
  name?: string;
  enc_recording?: string;
  enabled?: boolean;
  uuid?: string;
}

export class BankMacroStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async hasPassword():Promise<boolean> {
    let rows = await this.store.query(
      `SELECT enc_recording
      FROM bank_macro
      WHERE coalesce(enc_recording, '') <> ''
      LIMIT 1`, {})
    if (rows.length) {
      return true
    } else {
      return false
    }
  }
  async getPassword():Promise<string> {
    const pwkey = 'buckets.encryption';
    // XXX when you decide to store in the OS keychain, change
    // this to something unique to the budget file
    if (! await this.hasPassword() ) {
      // No password set yet
      let password = await createPassword(this.store, pwkey, sss('Create budget password:'));
      await this.store.sub.passwords.cachePassword(pwkey, password);
      return password;
    } else {
      // Already have a set password
      let password = await this.store.sub.passwords.getPassword({
        pwkey,
        prompt: sss('Budget password:'/* Label for bank macro password prompt */),
      });

      if (await this.isPasswordCorrect(password)) {
        await this.store.sub.passwords.cachePassword(pwkey, password);
      } else {
        throw new IncorrectPassword('Incorrect password');
      }
      return password;
    }
  }
  private async isPasswordCorrect(password:string):Promise<boolean> {
    let rows = await this.store.query<{enc_recording:string}>(
      `SELECT enc_recording
      FROM bank_macro
      WHERE coalesce(enc_recording, '') <> ''
      LIMIT 1`, {})
    if (rows.length) {
      try {
        await decrypt(rows[0].enc_recording, password)
        return true;
      } catch(err) {
        return false;
      }
    } else {
      // there's no existing encryption, so it's the "correct" password
      return true;
    }
  }
  async _prepareForDB(args:IUpdateArgs={}):Promise<BankMacroGuts> {
    let bank_macro:BankMacroGuts = {
      name: args.name,
      enc_recording: undefined,
      enabled: args.enabled,
    };
    if (args.recording_str) {
      const password = await this.getPassword();  
      bank_macro.enc_recording = await encrypt(args.recording_str, password)
    }
    return bank_macro;
  }
  async decryptRecording(bank_macro:BankMacro):Promise<{
    recording_str: string,
  }> {
    let recording_str:string;
    if (bank_macro.enc_recording) {
      const password = await this.getPassword();
      recording_str = await decrypt(bank_macro.enc_recording, password);
    }
    return { recording_str }
  }
  async add(args:IUpdateArgs):Promise<BankMacro> {
    let data = await this._prepareForDB(args);
    data.uuid = uuid();
    return this.store.createObject('bank_macro', data);
  }
  async list():Promise<BankMacro[]> {
    return this.store.listObjects('bank_macro', {
      order: ['name ASC', 'id'],
    })
  }
  async get(macro_id:number):Promise<BankMacro> {
    return this.store.getObject('bank_macro', macro_id);
  }
  async update(macro_id:number, args:IUpdateArgs):Promise<BankMacro> {
    const data = await this._prepareForDB(args);
    return this.store.updateObject('bank_macro', macro_id, data);
  }
  async delete(macro_id:number):Promise<any> {
    return this.store.deleteObject('bank_macro', macro_id);
  }
  async runMacro(macro_id:number, onOrAfter:moment.Moment, before:moment.Moment):Promise<SyncResult> {
    let today = localNow();
    if (today.isBefore(onOrAfter)) {
      // We're in the future
      onOrAfter = today.clone().startOf('month');
    }
    before = onOrAfter.clone().add(1, 'month');
    if (today.isBefore(before)) {
      before = today.clone().subtract(1, 'day');
    }

    let errors = [];
    let imported_count = 0;
    log.info(`Running macro #${macro_id}`);
    try {
      let result:SyncResult = await this.store.ui.openBankMacroBrowser(macro_id, {
        onOrAfter,
        before,
      })
      errors = errors.concat(result.errors);
      imported_count += result.imported_count;
    } catch (err) {
      errors.push(err);
    }
    return {
      errors,
      imported_count,
    }
  }
}


export class MacroSyncer implements ISyncChannel {
  constructor(private store:IStore) {
  }
  syncTransactions(onOrAfter:moment.Moment, before:moment.Moment) {
    return new MacroSync(this.store, onOrAfter, before);
  }
}

export class MacroSync implements ASyncening {
  public result:SyncResult;

  constructor(private store:IStore, readonly onOrAfter:moment.Moment, readonly before:moment.Moment) {

  }
  async start():Promise<SyncResult> {
    log.info('MacroSync start', this.onOrAfter.format('l'), this.before.format('l'))
    let macros = (await this.store.sub.bankmacro.list()).filter(macro => macro.enabled);
    let { onOrAfter, before } = this;
    let errors = [];
    let imported_count = 0;
    for (let macro of macros) {
      log.info(`Syncing macro #${macro.id} ${macro.name}`);
      try {
        let result:SyncResult = await this.store.sub.bankmacro.runMacro(macro.id, onOrAfter, before);
        errors = errors.concat(result.errors);
        imported_count += result.imported_count;
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      errors,
      imported_count,
    }
  }
  cancel() {
    throw new Error('Not implemented');
  }
}
