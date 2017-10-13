import { IObject, IStore, registerClass } from '../store'
import { encrypt, decrypt, promptUser } from '../crypto'
import * as reclib from '../recordlib'

export class BankRecording implements IObject {
  static table_name: string = 'bank_recording';
  id: number;
  created: string;
  readonly _type: string = BankRecording.table_name;
  name: string;
  recording: string;
  enc_credentials: string;
}
registerClass(BankRecording);


interface IUpdateArgs {
  name?: string;
  recording?: reclib.Recording;
  credentials?: object;
}

export class BankRecordingStore {
  public store:IStore;
  private password:string = null;
  constructor(store:IStore) {
    this.store = store;
  }
  async getPassword() {
    if (this.password === null) {
      this.password = await promptUser('Encryption password?', {
        password:true,
      })
      if (this.password === null) {
        throw new Error('Could not get password.');
      }
    }
    return this.password;
  }
  async _prepareForDB(args:IUpdateArgs):Promise<Partial<BankRecording>> {
    let data:any = args || {};
    if (data.credentials) {
      let password = await this.getPassword();
      data.enc_credentials = await encrypt(JSON.stringify(data.credentials), password)
      delete data.credentials;
    }
    if (data.recording) {
      data.recording = JSON.stringify(data.recording);
    }
    const partial:Partial<BankRecording> = data;
    return partial;
  }
  async decryptCredentials(enc_credentials:string):Promise<object> {
    const password = await this.getPassword();
    return JSON.parse(await decrypt(enc_credentials, password));
  }
  async add(args:IUpdateArgs):Promise<BankRecording> {
    const data = await this._prepareForDB(args);
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
