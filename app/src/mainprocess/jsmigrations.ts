import * as moment from 'moment-timezone'
import { ts2localdb, utcToLocal } from '../time'
import { PrefixLogger } from '../logging'
import { AsyncDatabase } from '../async-sqlite'

const log = new PrefixLogger('(jsmig)');



export interface Migration {
  order: number;
  name: string;
  func: (db:AsyncDatabase)=>Promise<any>;
}
export const migrations:Migration[] = [
  {
    order: 10,
    name: 'postedtolocal',
    async func(db:AsyncDatabase) {
      let updates = [];

      /**
       *  Parse a UTC time with a backward offset
       */
      function convertPostedToLocal(x:string):string {
        let mom = moment.tz(x, 'UTC');
        let local = utcToLocal(mom);
        let fudged = mom.clone().subtract(2*local.utcOffset(), 'minutes');
        return ts2localdb(fudged);
      }

      const a_rows = await db.all<any>('SELECT id, posted FROM account_transaction ORDER BY posted')
      for (const a_row of a_rows) {
        const new_posted = convertPostedToLocal(a_row.posted);
        log.info(`Changing atrans ${a_row.id} ${a_row.posted} -> ${new_posted}`);
        updates.push(`UPDATE account_transaction SET posted='${new_posted}' WHERE id='${a_row.id}';`)
      }

      const b_rows = await db.all<any>('SELECT id, posted FROM bucket_transaction ORDER BY posted')
      for (const b_row of b_rows) {
        const new_posted = convertPostedToLocal(b_row.posted);
        log.info(`Changing btrans ${b_row.id} ${b_row.posted} -> ${new_posted}`);
        updates.push(`UPDATE bucket_transaction SET posted='${new_posted}' WHERE id='${b_row.id}';`)
      }

      await db.exec(updates.join('\n'));
    }
  }
]