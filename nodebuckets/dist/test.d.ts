declare var bucketslib: any;
declare const main: any, db_all: any, db_run: any, db_executeMany: any;
declare let test_counter: number;
declare function dotest(name: string, func: Function): Promise<void>;
declare function mainFunc(): Promise<void>;
