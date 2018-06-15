import { IStore } from '../store'
declare module '../store' {
  interface ISubStore {
    passwords: PasswordFetcher;
  }
}

class EventualValue<T> {
  private _hasvalue = false;
  private _value:T = null;
  private _waiting:Function[] = [];

  async get():Promise<T> {
    if (this._hasvalue) {
      return this._value;
    } else {
      return new Promise<T>((resolve, reject) => {
        this._waiting.push(resolve);
      });
    }
  }
  resolve(value:T) {
    this._value = value;
    this._hasvalue = true;
    this._waiting.forEach(resolve => {
      resolve(value);
    })
  }
}

export class PasswordFetcher {

  private store = new EventualValue<IStore>();

  constructor(private _store: IStore) {
    this._loadSchema()
  }
  private async _loadSchema() {
    await this._store.query(`
      CREATE TEMPORARY TABLE IF NOT EXISTS _password_cache (
        pwkey TEXT PRIMARY KEY NOT NULL,
        password TEXT
      )`, {})
    this.store.resolve(this._store);
  }
  /**
   *  Cache a password in memory
   */
  async cachePassword(pwkey:string, password:string) {
    const store = await this.store.get()
    await store.query(`INSERT INTO _password_cache (pwkey, password) VALUES ($pwkey, $password)`, {
      $pwkey: pwkey,
      $password: password,
    })
  }
  /**
   *  Get a password from the cache, or the user typing it in.
   */
  async getPassword(args:{
    pwkey: string;
    prompt: string;
    nocache?: boolean;
    error_message?: string;
  }):Promise<string> {
    const store = await this.store.get()
    if (!args.nocache) {
      // check the cache
      const rows = await store.query<{password:string}>('SELECT password FROM _password_cache WHERE pwkey=$pwkey', {$pwkey: args.pwkey})
      if (rows.length) {
        return rows[0].password;
      }
    }
    
    return await store.ui.getPassword({
      pwkey: args.pwkey,
      prompt: args.prompt,
      error_message: args.error_message,
    })
  }
}
