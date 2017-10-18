import {v4 as uuid} from 'uuid'
import { IObject, IStore, registerClass } from '../store'
import { encrypt, decrypt, getPassword } from '../crypto'
import * as reclib from '../recordlib'

export class BankRecording implements IObject {
  static table_name: string = 'bank_recording';
  id: number;
  created: string;
  readonly _type: string = BankRecording.table_name;
  uuid: string;
  name: string;
  enc_recording: string;
  enc_values: string;
}
registerClass(BankRecording);


interface IUpdateArgs {
  name?: string;
  recording?: reclib.Recording;
  values?: object;
}

export class BankRecordingStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async getPassword() {
    // XXX when you decide to store in the OS keychain, change
    // these service and account values to something unique
    // to the budget file
    return await getPassword('buckets.encryption', 'encryption', {
      prompt: 'Encryption password?',
    });
  }
  async _prepareForDB(args:IUpdateArgs):Promise<Partial<BankRecording>> {
    let data:any = args || {};
    if (data.values) {
      let password = await this.getPassword();
      data.enc_values = await encrypt(JSON.stringify(data.values), password)
      delete data.values;
    }
    if (data.recording) {
      let password = await this.getPassword();
      data.enc_recording = await encrypt(JSON.stringify(data.recording), password)
      delete data.recording;
    }
    const partial:Partial<BankRecording> = data;
    return partial;
  }
  async decryptBankRecording(bank_recording:BankRecording):Promise<{
    recording: reclib.Recording,
    values: object,
  }> {
    const password = await this.getPassword();
    let values = null;
    if (bank_recording.enc_values) {
      values = JSON.parse(await decrypt(bank_recording.enc_values, password));
    }
    let recording = null;
    if (bank_recording.enc_recording) {
      recording = reclib.Recording.parse(await decrypt(bank_recording.enc_recording, password));
    }
    return { values, recording }
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
