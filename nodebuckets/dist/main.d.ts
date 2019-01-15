interface BucketsCLib {
    version(): string;
    register_logger(proc: (x: string) => void): string;
    stringpc(command: string, arg: string): string;
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
export declare function db_all_arrays(bf_id: number, query: string, params: SqliteParams): {
    rows: Array<Array<string>>;
    cols: Array<string>;
    types: Array<SqliteDataType>;
};
export declare function db_all<T>(bf_id: number, query: string, params: SqliteParams): T[];
export declare function db_run(bf_id: number, query: string, params: SqliteParams): number;
export declare function db_executeMany(bf_id: number, queries: string[]): void;
export declare const main: BucketsCLib;
export {};
