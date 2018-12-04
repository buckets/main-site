import { IObject, IStore } from '../store';

//-------------------------------------------------------
// Database objects
//-------------------------------------------------------
declare module '../store' {
  interface IObjectTypes {
    settings: ISettingsObject;
  }
  interface ISubStore {
    settings: SettingsStore;
  }
  interface IFromDBFunctions {
    settings: (obj:ISettingsObject)=>ISettingsObject;
  }
}

export interface ISettings {
  reports_timeback_number: number;
  reports_timeback_unit: 'month'|'year';
  money_symbol: string,
  accounts_in_sidebar: boolean;
}

export const DEFAULTS:ISettings = {
  reports_timeback_number: 18,
  reports_timeback_unit: 'month',
  money_symbol: '',
  accounts_in_sidebar: false,
}

export interface ISettingsObject extends IObject {
  _type: 'settings';
  key: keyof ISettings;
  value: any;
}

export function ISettingsObjectFromDB(obj:ISettingsObject) {
  try {
    obj.value = JSON.parse(obj.value as string);  
  } catch(err) {
    obj.value = DEFAULTS[obj.key];
  }
  return obj;
}


/**
 *  Interface for settings
 */
export class SettingsStore {
  public store:IStore;
  constructor(store:IStore) {
    this.store = store;
  }
  async getSettings():Promise<ISettings> {
    const rows = await this.store.query<{key:keyof ISettings,value:any}>('SELECT key, value FROM settings', {})
    let ret:Partial<ISettings> = {};
    rows.forEach(row => {
      console.log("row", row);
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
      await this.store.createObject('settings', {
        key: key as keyof ISettings,
        value: JSON.stringify(data[key]),
      });
    }
  }
}

