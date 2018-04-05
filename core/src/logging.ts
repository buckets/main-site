
let BASE_LOGGER:ILogger = console;

export function setBaseLogger(logger:ILogger) {
  BASE_LOGGER = logger;
}

export interface ILogger {
  info(...args):void;
  warn(...args):void;
  error(...args):void;
}

export interface IPrefixLogger extends ILogger {
  child(prefix:string, logger?:any):ILogger;
}

/**
 *  A logger that will prepend every message with a string.
 */
export class PrefixLogger implements IPrefixLogger {
  constructor(public prefix:string, private logger?:ILogger) {
    this.logger = logger || BASE_LOGGER;
  }
  child(prefix:string, logger?:any) {
    return new PrefixLogger(`${this.prefix} ${prefix}`, logger || this.logger);
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
