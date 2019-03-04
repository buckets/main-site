// @ts-ignore
const bucketsinternal:BucketsInternal = require(`../lib/${process.arch}/bucketslib.node`);

interface BucketsInternal {
  // Keep this in sync with jstonimbinding.cpp
  start():void;
  version():Buffer;
  register_logger(proc:(x:string)=>void):void;
  // stringpc(command:Buffer, arg:string):Buffer;
  openfile(filename:Buffer):number;
  db_all_json(db:number, query:Buffer, params_json_array:Buffer):Buffer;
  db_run_json(db:number, query:Buffer, params_json_array:Buffer):Buffer;
  db_execute_many_json(db:number, queries_json_array:Buffer):Buffer;
}

bucketsinternal.start();

type SqliteDataType =
  | "Null"
  | "Int"
  | "Float"
  | "Text"
  | "Bool"
  | "Blob"

type SqliteParam =
  | string
  | number
  | null
  | boolean

interface SqliteParamObj {
  [k:string]: SqliteParam
}

type SqliteParams =
  | SqliteParam[]
  | SqliteParamObj

class Semaphore {
  private pending:Array<Function> = [];

  constructor(private available = 1) {

  }
  count():number {
    return this.available;
  }
  acquire():Promise<null> {
    return new Promise<null>((resolve, reject) => {
      this.pending.push(resolve);
      this.tick();
    })
  }
  release() {
    this.available += 1;
    this.tick();
  }
  tick() {
    while (this.available > 0 && this.pending.length > 0) {
      this.available -= 1;
      const func = this.pending.shift();
      if (func) {
        func(null);
      }
    }
  }
  async run<T>(func:()=>T) {
    await this.acquire();
    try {
      return func();
    } catch(err) {
      throw err;
    } finally {
      this.release();
    }
  }
}

const SEM = new Semaphore(1);

export function version():string {
  return bucketsinternal.version().toString('utf8');
}

export function openfile(filename:string):number {
  if (!SEM.count()) {
    console.error("Attempting to call openfile while there is another function running");
  }
  return bucketsinternal.openfile(Buffer.from(filename));
}

export function registerLogger(proc:(x:string)=>void) {
  bucketsinternal.register_logger(proc);
}

/**
 * Run a query and return all the results as arrays of arrays
 * 
 * @param bf_id 
 * @param query 
 * @param params 
 */
export function db_all_arrays(bf_id:number, query:string, params?:SqliteParams):Promise<{
  rows: Array<Array<string>>,
  cols: Array<string>,
  types: Array<SqliteDataType>,
}> {
  params = params || [];
  return SEM.run(() => {
    let res:any;
    let json_res:string = bucketsinternal.db_all_json(
      bf_id,
      Buffer.from(query + '\0'),
      Buffer.from(JSON.stringify(params || []) + '\0')
    ).toString('utf8')
    try {
      res = JSON.parse(json_res);
    } catch(err) {
      console.log("ERROR");
      console.log("On query:", JSON.stringify(query));
      console.log("Params:", JSON.stringify(params));
      console.log("db_all_arrays Invalid JSON string:", json_res);
      throw err;
    }
    
    if (res.err) {
      // console.log("db_all_arrays got error result");
      throw Error(res.err);
    } else {
      return {
        rows: res.rows,
        cols: res.cols,
        types: res.types,
      };
    }
  })
}

export async function db_all<T>(bf_id:number, query:string, params?:SqliteParams):Promise<T[]> {
  let result = await db_all_arrays(bf_id, query, params);
  function convert(row:string[]) {
    let ret:any = {};
    for (let i = 0; i < result.cols.length; i++) {
      let colname = result.cols[i];
      switch(result.types[i]) {
        case "Null": {
          ret[colname] = null;
          break;
        }
        case "Blob":
        case "Text": {
          ret[colname] = row[i];
          break;
        }
        case "Int": {
          ret[colname] = parseInt(row[i]);
          break;
        }
        case "Float": {
          ret[colname] = Number(row[i]);
          break;
        }
        case "Bool": {
          ret[colname] = !!parseInt(row[i]);
          break;
        }
      }
    }
    return ret;
  }
  return result.rows.map<T>(convert);
}

export function db_run(bf_id:number, query:string, params?:SqliteParams) {
  return SEM.run(() => {
    params = params || [];
    let res:any;
    let json_res = bucketsinternal.db_run_json(
      bf_id,
      Buffer.from(query + '\0'),
      Buffer.from(JSON.stringify(params) + '\0')
    ).toString('utf8')
    try {
      res = JSON.parse(json_res);
    } catch(err) {
      console.log("db_run Invalid JSON string:", json_res);
      throw err;
    }
    if (res.err) {
      // console.log("db_run got error result");
      throw Error(res.err);
    } else {
      return res.lastID as number;
    }
  })
}

export function db_executeMany(bf_id:number, queries:string[]) {
  return SEM.run(() => {
    let err = bucketsinternal.db_execute_many_json(
      bf_id,
      Buffer.from(JSON.stringify(queries) + '\0')
    )
    if (err.length) {
      // console.log("db_executeMany got error result");
      throw Error(err.toString('utf8'));
    }
  })
}

export const internal:BucketsInternal = bucketsinternal;
