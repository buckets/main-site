"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var bucketsinternal = __importStar(require("../lib/bucketslib.node"));
bucketsinternal.start();
var Semaphore = /** @class */ (function () {
    function Semaphore(available) {
        if (available === void 0) { available = 1; }
        this.available = available;
        this.pending = [];
    }
    Semaphore.prototype.count = function () {
        return this.available;
    };
    Semaphore.prototype.acquire = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.pending.push(resolve);
            _this.tick();
        });
    };
    Semaphore.prototype.release = function () {
        this.available += 1;
        this.tick();
    };
    Semaphore.prototype.tick = function () {
        while (this.available > 0 && this.pending.length > 0) {
            this.available -= 1;
            var func = this.pending.shift();
            if (func) {
                func(null);
            }
        }
    };
    Semaphore.prototype.run = function (func) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.acquire()];
                    case 1:
                        _a.sent();
                        try {
                            return [2 /*return*/, func()];
                        }
                        catch (err) {
                            throw err;
                        }
                        finally {
                            this.release();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return Semaphore;
}());
var SEM = new Semaphore(1);
function version() {
    return bucketsinternal.version().toString('utf8');
}
exports.version = version;
function openfile(filename) {
    if (!SEM.count()) {
        console.error("Attempting to call openfile while there is another function running");
    }
    return bucketsinternal.openfile(Buffer.from(filename));
}
exports.openfile = openfile;
function registerLogger(proc) {
    bucketsinternal.register_logger(proc);
}
exports.registerLogger = registerLogger;
/**
 * Run a query and return all the results as arrays of arrays
 *
 * @param bf_id
 * @param query
 * @param params
 */
function db_all_arrays(bf_id, query, params) {
    params = params || [];
    return SEM.run(function () {
        var res;
        var json_res = bucketsinternal.db_all_json(bf_id, Buffer.from(query + '\0'), Buffer.from(JSON.stringify(params || []) + '\0')).toString('utf8');
        try {
            res = JSON.parse(json_res);
        }
        catch (err) {
            console.log("ERROR");
            console.log("On query:", JSON.stringify(query));
            console.log("Params:", JSON.stringify(params));
            console.log("db_all_arrays Invalid JSON string:", json_res);
            throw err;
        }
        if (res.err) {
            // console.log("db_all_arrays got error result");
            throw Error(res.err);
        }
        else {
            return {
                rows: res.rows,
                cols: res.cols,
                types: res.types,
            };
        }
    });
}
exports.db_all_arrays = db_all_arrays;
function db_all(bf_id, query, params) {
    return __awaiter(this, void 0, void 0, function () {
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
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_all_arrays(bf_id, query, params)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows.map(convert)];
            }
        });
    });
}
exports.db_all = db_all;
function db_run(bf_id, query, params) {
    return SEM.run(function () {
        params = params || [];
        var res;
        var json_res = bucketsinternal.db_run_json(bf_id, Buffer.from(query + '\0'), Buffer.from(JSON.stringify(params) + '\0')).toString('utf8');
        try {
            res = JSON.parse(json_res);
        }
        catch (err) {
            console.log("db_run Invalid JSON string:", json_res);
            throw err;
        }
        if (res.err) {
            // console.log("db_run got error result");
            throw Error(res.err);
        }
        else {
            return res.lastID;
        }
    });
}
exports.db_run = db_run;
function db_executeMany(bf_id, queries) {
    return SEM.run(function () {
        var err = bucketsinternal.db_execute_many_json(bf_id, Buffer.from(JSON.stringify(queries) + '\0'));
        if (err.length) {
            // console.log("db_executeMany got error result");
            throw Error(err.toString('utf8'));
        }
    });
}
exports.db_executeMany = db_executeMany;
exports.internal = bucketsinternal;
