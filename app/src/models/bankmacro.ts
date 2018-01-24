import * as moment from 'moment'
import {v4 as uuid} from 'uuid'

import { IObject, IStore, registerClass } from '../store'
import { encrypt, decrypt, getPassword, cachePassword } from '../crypto'
import * as reclib from '../recordlib'
import { IncorrectPassword } from '../error'
import { sss } from '../i18n'
import { ISyncChannel, ASyncening, SyncResult } from '../sync'
import { IBudgetFile } from '../mainprocess/files'
import { PrefixLogger } from '../logging'

const log = new PrefixLogger('(bankmacro)');

export class BankMacro implements IObject {
  static type: string = 'bank_macro';
  id: number;
  created: string;
  readonly _type: string = BankMacro.type;
  uuid: string;
  name: string;
  enc_recording: string;
  enabled: boolean;

  static fromdb(obj:BankMacro) {
    obj.enabled = !!obj.enabled;
    return obj;
  }
}
registerClass(BankMacro);


async function createPassword(service:string, account:string, prompt:string):Promise<string> {
  let error;
  for (var i = 0; i < 3; i++) {
    let p1 = await getPassword(service, account, {
      prompt: prompt,
      no_cache: true,
      error: error,
    });
    let p2 = await getPassword(service, account, {
      prompt: sss('Confirm password:'),
      no_cache: true,
    })
    if (p1 === p2) {
      return p1;
    } else {
      error = sss('Passwords did not match');
    }
  }
  throw new Error("Passwords didn't match");
}


interface IUpdateArgs {
  name?: string;
  recording?: reclib.Recording;
  enabled?: boolean;
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
    const service = 'buckets.encryption';
    const account = 'encryption';
    // XXX when you decide to store in the OS keychain, change
    // these service and account values to something unique
    // to the budget file
    if (! await this.hasPassword() ) {
      // No password set yet
      let password = await createPassword(service, account, sss('Create budget password:'));
      await cachePassword(service, account, password);
      return password;
    } else {
      // Already have a set password
      let password = await getPassword(service, account, {
        prompt: 'Budget password:',
      });
      if (await this.isPasswordCorrect(password)) {
        await cachePassword(service, account, password);
      } else {
        throw new IncorrectPassword('Incorrect password');
      }
      return password;
    }
  }
  private async isPasswordCorrect(password:string):Promise<boolean> {
    let rows = await this.store.query(
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
  async _prepareForDB(args:IUpdateArgs):Promise<Partial<BankMacro>> {
    let data:any = args || {};
    if (data.recording) {
      const password = await this.getPassword();  
      data.enc_recording = await encrypt(JSON.stringify(data.recording), password)
      delete data.recording;
    }
    const partial:Partial<BankMacro> = data;
    return partial;
  }
  async decryptRecording(bank_macro:BankMacro):Promise<{
    recording: reclib.Recording,
  }> {
    let recording = null;
    if (bank_macro.enc_recording) {
      const password = await this.getPassword();
      recording = reclib.Recording.parse(await decrypt(bank_macro.enc_recording, password));
    }
    return { recording }
  }
  async add(args:IUpdateArgs):Promise<BankMacro> {
    const data = await this._prepareForDB(args);
    if (!data.uuid) {
      data.uuid = uuid();
    }
    return this.store.createObject(BankMacro, data);
  }
  async list():Promise<BankMacro[]> {
    return this.store.listObjects(BankMacro, {
      order: ['name ASC', 'id'],
    })
  }
  async get(macro_id:number):Promise<BankMacro> {
    return this.store.getObject(BankMacro, macro_id);
  }
  async update(macro_id:number, args:IUpdateArgs):Promise<BankMacro> {
    const data = await this._prepareForDB(args);
    return this.store.updateObject(BankMacro, macro_id, data);
  }
  async delete(macro_id:number):Promise<any> {
    return this.store.deleteObject(BankMacro, macro_id);
  }
  async runMacro(file:IBudgetFile, macro_id:number, onOrAfter:moment.Moment, before:moment.Moment):Promise<SyncResult> {
    let today = moment();
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
      let result:SyncResult = await file.openRecordWindow(macro_id, {
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
  constructor(private store:IStore, private file:IBudgetFile) {
  }
  syncTransactions(onOrAfter:moment.Moment, before:moment.Moment) {
    return new MacroSync(this.store, this.file, onOrAfter, before);
  }
}

class MacroSync implements ASyncening {
  public result:SyncResult;

  constructor(private store:IStore, private file:IBudgetFile, readonly onOrAfter:moment.Moment, readonly before:moment.Moment) {

  }
  async start():Promise<SyncResult> {
    log.info('MacroSync start', this.onOrAfter.format('l'), this.before.format('l'))
    let macros = (await this.store.bankmacro.list()).filter(macro => macro.enabled);
    let { onOrAfter, before } = this;
    let errors = [];
    let imported_count = 0;
    for (let macro of macros) {
      log.info(`Syncing macro #${macro.id} ${macro.name}`);
      try {
        let result:SyncResult = await this.store.bankmacro.runMacro(this.file, macro.id, onOrAfter, before);
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
