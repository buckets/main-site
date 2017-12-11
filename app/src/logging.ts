import * as electron_log from 'electron-log'


/**
 *  A logger that will prepend every message with a string.
 */
export class PrefixLogger {
  constructor(public prefix:string, private logger?:any) {
    this.logger = logger || electron_log
  }
  child(prefix:string, logger?:any) {
    return new PrefixLogger(`${this.prefix} ${prefix}`, logger || this.logger);
  }
  debug(...args) {
    return this.logger.debug(this.prefix, ...args);
  }
  info(...args) {
    return this.logger.info(this.prefix, ...args);
  }
  warn(...args) {
    return this.logger.warn(this.prefix, ...args);
  }
  error(...args) {
    return this.logger.error(this.prefix, ...args);
  }
}