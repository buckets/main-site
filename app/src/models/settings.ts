import { IObject, registerClass, IStore } from '../store';

export interface ISettings {
  reports_timeback_number: number;
  reports_timeback_unit: 'month'|'year';
  money_symbol: string,
}

export const DEFAULTS:ISettings = {
  reports_timeback_number: 18,
  reports_timeback_unit: 'month',
  money_symbol: '',
}

export class Setting implements IObject {
  static type: string = 'settings';
  id: number;
  created: string;
  readonly _type: string = Setting.type;
  key: keyof ISettings;
  value: any;

  static fromdb(obj:Setting) {
    try {
      obj.value = JSON.parse(obj.value as string);  
    } catch(err) {
      obj.value = DEFAULTS[obj.key];
    }
    return obj;
  }
}
registerClass(Setting);


/**
 *  Interface for settings
 */
export class SettingsStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async getSettings():Promise<ISettings> {
    const rows = await this.store.query('SELECT key, value FROM settings', {})
    let ret:Partial<ISettings> = {};
    rows.forEach(row => {
      let value;
      try {
        value = JSON.parse(row.value);
      } catch(err) {
        value = DEFAULTS[row.key];
      }
      ret[row.key] = value;
    })
    return Object.assign({}, DEFAULTS, ret)
  }
  async updateSettings(data:Partial<ISettings>) {
    for (const key of Object.keys(data)) {
      await this.store.createObject(Setting, {
        key: key as keyof ISettings,
        value: JSON.stringify(data[key]),
      });
    }
  }
}

