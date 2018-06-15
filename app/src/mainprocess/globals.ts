import { app, remote } from 'electron'
import * as fs from 'fs-extra-promise'
import * as Path from 'path';

/**
 *  Path to the directory where src/ lives.  The path in which you
 *  run `electron .`
 */
export const APP_ROOT = Path.join(__dirname, '../../');
let realapp = remote ? remote.app : app;
export const IS_DEBUG = realapp ? fs.existsSync(Path.join(realapp.getPath('userData'), 'debug')) : true;
