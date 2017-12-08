import {v4 as uuid} from 'uuid'
import { IObject, IStore, registerClass } from '../store'
import { encrypt, decrypt, getPassword, cachePassword } from '../crypto'
import * as reclib from '../recordlib'
import { IncorrectPassword } from '../error'
import { sss } from '../i18n'

export class BankRecording implements IObject {
  static type: string = 'bank_recording';
  id: number;
  created: string;
  readonly _type: string = BankRecording.type;
  uuid: string;
  name: string;
  enc_recording: string;
}
registerClass(BankRecording);


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
}

export class BankRecordingStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async hasPassword():Promise<boolean> {
    let rows = await this.store.query(
      `SELECT enc_recording
      FROM bank_recording
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
      FROM bank_recording
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
  async _prepareForDB(args:IUpdateArgs):Promise<Partial<BankRecording>> {
    let data:any = args || {};
    if (data.recording) {
      const password = await this.getPassword();  
      data.enc_recording = await encrypt(JSON.stringify(data.recording), password)
      delete data.recording;
    }
    const partial:Partial<BankRecording> = data;
    return partial;
  }
  async decryptBankRecording(bank_recording:BankRecording):Promise<{
    recording: reclib.Recording,
  }> {
    let recording = null;
    if (bank_recording.enc_recording) {
      const password = await this.getPassword();
      recording = reclib.Recording.parse(await decrypt(bank_recording.enc_recording, password));
    }
    return { recording }
  }
  async add(args:IUpdateArgs):Promise<BankRecording> {
    const data = await this._prepareForDB(args);
    if (!data.uuid) {
      data.uuid = uuid();
    }
    return this.store.createObject(BankRecording, data);
  }
  async list():Promise<BankRecording[]> {
    return this.store.listObjects(BankRecording, {
      order: ['name ASC', 'id'],
    })
  }
  async get(recording_id:number):Promise<BankRecording> {
    return this.store.getObject(BankRecording, recording_id);
  }
  async update(recording_id:number, args:IUpdateArgs):Promise<BankRecording> {
    const data = await this._prepareForDB(args);
    return this.store.updateObject(BankRecording, recording_id, data);
  }
  async delete(recording_id:number):Promise<any> {
    return this.store.deleteObject(BankRecording, recording_id);
  }
}
