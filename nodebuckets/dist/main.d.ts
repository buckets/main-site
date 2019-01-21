/// <reference types="node" />
interface BucketsCLib {
    start(): void;
    version(): string;
    register_logger(proc: (x: string) => void): void;
    stringpc(command: string, arg: string): Buffer;
    openfile(filename: string): number;
    db_all_json(db: number, query: string, params_json_array: string): string;
    db_run_json(db: number, query: string, params_json_array: string): string;
    db_execute_many_json(db: number, queries_json_array: string): string;
}
declare type SqliteDataType = "Null" | "Int" | "Float" | "Text" | "Bool" | "Blob";
declare type SqliteParam = string | number | null | boolean;
interface SqliteParamObj {
    [k: string]: SqliteParam;
}
declare type SqliteParams = SqliteParam[] | SqliteParamObj;
export declare function db_all_arrays(bf_id: number, query: string, params: SqliteParams): Promise<{
    rows: Array<Array<string>>;
    cols: Array<string>;
    types: Array<SqliteDataType>;
}>;
export declare function db_all<T>(bf_id: number, query: string, params: SqliteParams): Promise<T[]>;
export declare function db_run(bf_id: number, query: string, params: SqliteParams): Promise<number>;
export declare function db_executeMany(bf_id: number, queries: string[]): Promise<void>;
export declare const main: BucketsCLib;
export {};
