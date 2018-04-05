import { setBaseLogger } from 'buckets-core'
export { PrefixLogger } from 'buckets-core'
import * as electron_log from 'electron-log'

setBaseLogger(electron_log);
