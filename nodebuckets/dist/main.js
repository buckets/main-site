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
function db_all_arrays(bf_id, query, params) {
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
exports.db_all_arrays = db_all_arrays;
function db_all(bf_id, query, params) {
    var result = db_all_arrays(bf_id, query, params);
    function convert(row) {
        var ret = {};
        for (var i = 0; i < result.cols.length; i++) {
            var colname = result.cols[i];
            switch (result.types[i]) {
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
    return result.rows.map(convert);
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
exports.main = bucketslib;
