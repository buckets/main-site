/// <reference types="node" />
interface BucketsInternal {
    start(): void;
    version(): Buffer;
    register_logger(proc: (x: string) => void): void;
    openfile(filename: Buffer): number;
    db_all_json(db: number, query: Buffer, params_json_array: Buffer): Buffer;
    db_run_json(db: number, query: Buffer, params_json_array: Buffer): Buffer;
    db_execute_many_json(db: number, queries_json_array: Buffer): Buffer;
}
declare type SqliteDataType = "Null" | "Int" | "Float" | "Text" | "Bool" | "Blob";
declare type SqliteParam = string | number | null | boolean;
interface SqliteParamObj {
    [k: string]: SqliteParam;
}
declare type SqliteParams = SqliteParam[] | SqliteParamObj;
export declare function version(): string;
export declare function openfile(filename: string): number;
export declare function registerLogger(proc: (x: string) => void): void;
/**
 * Run a query and return all the results as arrays of arrays
 *
 * @param bf_id
 * @param query
 * @param params
 */
export declare function db_all_arrays(bf_id: number, query: string, params?: SqliteParams): Promise<{
    rows: Array<Array<string>>;
    cols: Array<string>;
    types: Array<SqliteDataType>;
}>;
export declare function db_all<T>(bf_id: number, query: string, params?: SqliteParams): Promise<T[]>;
export declare function db_run(bf_id: number, query: string, params?: SqliteParams): Promise<number>;
export declare function db_executeMany(bf_id: number, queries: string[]): Promise<void>;
export declare const internal: BucketsInternal;
export {};
