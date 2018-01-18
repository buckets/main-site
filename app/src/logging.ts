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
  silly(...args) {
    return this.logger.silly(this.prefix, ...args);
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

export function setFileLogLevel(level:'silly'|'info'|'debug') {
  electron_log.transports.file.level = level;
  electron_log.info(`log level=${level}`)
}

export function getFileLogLevel() {
  return electron_log.transports.file.level;
}
