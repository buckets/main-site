export { IMessages } from './base';

//----------------------------------------------------------------
// Copied for now from core/i18n.ts
//----------------------------------------------------------------

/**
 *  An individual message in a IMessageSet
 */
export interface IMsg<T> {
  val: T;
  translated: boolean;
  h: string;
  newval?: T;
}
/**
 *  An applications set of messages
 */
export interface IMessageSet {
  [k:string]: IMsg<any>;
}
/**
 *  A locale for the application
 */
export interface ILangPack<T extends IMessageSet> {
  name: string;
  dir: 'ltr'|'rtl';
  numbers: NumberFormat;
  messages: T;
  contributors: Array<{
    name: string;
    href?: string;
  }>;
}