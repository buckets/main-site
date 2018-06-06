import * as util from 'util'

export function createErrorSubclass<T>(name:string) {
  const SubError = function(message?:string, otherprops?:T):void {
    Error.captureStackTrace(this, this.constructor);
    this.name = name;
    this.message = message;
    if (otherprops !== undefined) {
      Object.assign(this, otherprops);  
    }
  }
  util.inherits(SubError, Error);
  return SubError;
}
