import { app, remote } from 'electron'
import * as fs from 'fs-extra-promise'
import * as Path from 'path';
export const APP_ROOT = Path.join(__dirname, '../../');
let realapp = remote ? remote.app : app;
export const IS_DEBUG = fs.existsSync(Path.join(realapp.getPath('userData'), 'debug'));
