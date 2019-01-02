"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var bucketslib = __importStar(require("../lib/bucketslib.node"));
bucketslib.start();
function db_all(bf_id, query, params) {
    params = params || [];
    var res = JSON.parse(bucketslib.db_all_json(bf_id, query, JSON.stringify(params)));
    if (res.err) {
        throw Error(res.err);
    }
    else {
        return {
            rows: res.rows,
            cols: res.cols,
            types: res.types,
        };
    }
}
exports.db_all = db_all;
function db_run(bf_id, query, params) {
    params = params || [];
    var res = JSON.parse(bucketslib.db_run_json(bf_id, query, JSON.stringify(params)));
    if (res.err) {
        throw Error(res.err);
    }
    else {
        return res.lastID;
    }
}
exports.db_run = db_run;
function db_executeMany(bf_id, queries) {
    var err = bucketslib.db_execute_many_json(bf_id, JSON.stringify(queries));
    if (err) {
        throw Error(err);
    }
}
exports.db_executeMany = db_executeMany;
function db_paramArray(bf_id, query) {
    var orig = bucketslib.db_param_array_json(bf_id, query);
    var res = JSON.parse(orig);
    return res;
}
exports.db_paramArray = db_paramArray;
exports.main = bucketslib;
