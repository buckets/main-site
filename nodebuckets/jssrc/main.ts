// @ts-ignore
import * as bucketslib from '../lib/bucketslib.node';


interface BucketsCLib {
  // Keep this in sync with jstonimbinding.cpp
  // start():void; We don't want people calling start
  version():string;
  register_logger(proc:(x:string)=>void):string;
  stringpc(command:string, arg:string):string;
  openfile(filename:string):number;
  db_param_array_json(db:number, query:string):string;
  db_all_json(db:number, query:string, params_json_array:string):string;
  db_run_json(db:number, query:string, params_json_array:string):string;
  db_execute_many_json(db:number, queries_json_array:string):string;
}

bucketslib.start();

export function db_all(bf_id:number, query:string, params:string[]) {
  params = params || [];
  let res = JSON.parse(bucketslib.db_all_json(bf_id, query, JSON.stringify(params)));
  if (res.err) {
    throw Error(res.err);
  } else {
    return res.rows;
  }
}

export function db_run(bf_id:number, query:string, params:string[]) {
  params = params || [];
  let res = JSON.parse(bucketslib.db_run_json(bf_id, query, JSON.stringify(params)));
  if (res.err) {
    throw Error(res.err);
  } else {
    return res.lastID as number;
  }
}

export function db_executeMany(bf_id:number, queries:string[]) {
  let err = bucketslib.db_execute_many_json(bf_id, JSON.stringify(queries));
  if (err) {
    throw Error(err);
  }
}

export function db_paramArray(bf_id:number, query:string) {
  let orig = bucketslib.db_param_array_json(bf_id, query);
  let res:string[] = JSON.parse(orig);
  return res;
}

export const main:BucketsCLib = bucketslib;
