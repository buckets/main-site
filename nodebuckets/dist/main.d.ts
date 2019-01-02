interface BucketsCLib {
    version(): string;
    register_logger(proc: (x: string) => void): string;
    stringpc(command: string, arg: string): string;
    openfile(filename: string): number;
    db_param_array_json(db: number, query: string): string;
    db_all_json(db: number, query: string, params_json_array: string): string;
    db_run_json(db: number, query: string, params_json_array: string): string;
    db_execute_many_json(db: number, queries_json_array: string): string;
}
export declare function db_all(bf_id: number, query: string, params: string[]): any;
export declare function db_run(bf_id: number, query: string, params: string[]): number;
export declare function db_executeMany(bf_id: number, queries: string[]): void;
export declare function db_paramArray(bf_id: number, query: string): string[];
export declare const main: BucketsCLib;
export {};
