/**
 *  Create custom Errors like this:
 *
 *    class MyError extends CustomError {}
 */
export class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
