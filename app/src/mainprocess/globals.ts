import * as Path from 'path';
export const APP_ROOT = Path.join(__dirname, '../../');
export const IS_DEBUG = !!process.env.BUCKETS_DEBUG;
