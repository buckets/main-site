import {v4 as uuid} from 'uuid'
import { IObject, IStore, registerClass } from '../store'
import { encrypt, decrypt, getPassword, cachePassword } from '../crypto'
import * as reclib from '../recordlib'
import { IncorrectPassword } from '../error'

export class BankRecording implements IObject {
  static table_name: string = 'bank_recording';
  id: number;
  created: string;
  readonly _type: string = BankRecording.table_name;
  uuid: string;
  name: string;
  enc_recording: string;
}
registerClass(BankRecording);


interface IUpdateArgs {
  name?: string;
  recording?: reclib.Recording;
}

export class BankRecordingStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async getPassword():Promise<string> {
    const service = 'buckets.encryption';
    const account = 'encryption';
    // XXX when you decide to store in the OS keychain, change
    // these service and account values to something unique
    // to the budget file
    let password = await getPassword(service, account, {
      prompt: 'Budget password:',
    });
    if (await this.isPasswordCorrect(password)) {
      cachePassword(service, account, password);
    } else {
      throw new IncorrectPassword('Incorrect password');
    }
    return password;
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
    const password = await this.getPassword();
    let recording = null;
    if (bank_recording.enc_recording) {
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
}
