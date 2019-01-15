## This file contains the C interface to the buckets library
## It mostly does this:
##  - wraps other library functions in buckets_ prefixed names
##  - provides access to log messages emitted by Nim
import ./db
import ./budgetfile
import ../buckets
import strformat
import strutils
import sequtils
import json
import logging

#-----------------------------------
# Function-call logging
#-----------------------------------
type
  FunctionLogger = ref object of Logger
  LogFunc = proc(msg:cstring) {.cdecl.}

var LOG_FUNCTIONS:seq[LogFunc]

method log*(logger: FunctionLogger, level: Level, args: varargs[string, `$`]) =
  if level >= logger.levelThreshold:
    let ln = substituteLog(logger.fmtStr, level, args)
    GC_ref(ln)
    for fn in LOG_FUNCTIONS:
      fn(ln)
    GC_unref(ln)

#-----------------------------------

proc toDB*(budget_handle:int):DbConn =
  budget_handle.getBudgetFile().db

#-----------------------------------
# C-friendly named Nim functions
#-----------------------------------

proc buckets_version*():cstring {.exportc.} =
  ## Return the current buckets lib version
  var ret = PACKAGE_VERSION
  GC_ref(ret)
  result = ret

proc buckets_stringpc*(command:cstring, arg:cstring, arglen:int):cstring {.exportc.} =
  ## String-based RPC interface
  var fullarg:string
  fullarg = newString(arglen)
  copyMem(fullarg[0].unsafeAddr, arg, arglen)
  result = stringRPC($command, fullarg)

proc buckets_register_logger*(fn:LogFunc) {.exportc.} =
  ## Register a function to receive logging events from Nim.
  ## The function will be called with strings to be logged.
  LOG_FUNCTIONS.add(fn)
  if LOG_FUNCTIONS.len == 1:
    var logger:FunctionLogger
    new(logger)
    addHandler(logger)

proc buckets_openfile*(filename:cstring):int {.exportc.} =
  ## Open a budget file
  openBudgetFile($filename).id

template jsonObjToParam(node:JsonNode):Param =
  case node.kind
  of JInt:
    P(node.getInt())
  of JString:
    P(node.getStr())
  of JFloat:
    P(node.getFloat())
  of JNull:
    P(nil)
  of JBool:
    P(node.getBool())
  of JArray, JObject:
    raise newException(CatchableError, "Unsupported argument type:" & $node.kind)

proc json_to_params*(db:DbConn, query:cstring, params_json:cstring):seq[Param] =
  ## Convert a JSON Object or Array of query parameters into
  ## a sequence of Params suitable for using in a query.
  logging.debug "json_to_params"
  logging.debug query
  logging.debug params_json
  let parsed = parseJson($params_json)
  assert(parsed.kind == JArray or parsed.kind == JObject, "Only Arrays and Objects are supported for db params")
  case parsed.kind
  of JArray:
    for item in parsed.getElems():
      result.add(jsonObjToParam(item))
  of JObject:
    var
      pstmt: Pstmt
    if prepare_v2(db, query, query.len.cint, pstmt, nil) != SQLITE_OK:
      dbError(db)
    for i in 1..bind_parameter_count(pstmt):
      let key = $bind_parameter_name(pstmt, i)
      if parsed.hasKey(key):
        result.add(jsonObjToParam(parsed[key]))
      else:
        raise newException(CatchableError, &"Missing value for parameter: {key}")
  else:
    raise newException(CatchableError, "Invalid argument type for db params")

proc buckets_db_all_json*(budget_handle:int, query:cstring, params_json:cstring):cstring {.exportc.} =
  ## Perform a query and return the result as a JSON string
  ##    params_json should be a JSON-encoded array/object
  logging.debug "db_all_json:"
  logging.debug "query", query
  logging.debug "params", params_json
  var res_string:string = ""
  var params:seq[string]
  try:
    let db = budget_handle.getBudgetFile().db
    logging.debug "got budget file"
    let params = db.json_to_params(query, params_json)
    logging.debug "Got params: ", params.repr
    let res = db.fetchAll(sql($query), params)
    logging.debug "post fetchAll"
    res_string = $ %*
      {
        "err": "",
        "cols": res.cols,
        "rows": res.rows,
        "types": res.types,
      }
    logging.debug "post jsonify"
  except:
    logging.debug "exception?"
    res_string = $ %*
      {
        "err": getCurrentExceptionMsg(),
        "cols": @[],
        "rows": @[],
        "types": @[],
      }
  logging.debug("db_all_json done")
  GC_ref(res_string)
  result = res_string
  logging.debug("all: ", query, " params: ", params_json, " -> ", result)

proc buckets_db_run_json*(budget_handle:int, query:cstring, params_json:cstring):cstring {.exportc.} =
  ## Perform a query and return any error/lastID as a JSON string.
  ##    params_json should be a JSON-encoded array/object
  var res_string:string
  try:
    let
      db = budget_handle.getBudgetFile().db
      params = db.json_to_params(query, params_json)
      res = db.runQuery(sql($query), params)
    res_string = $ %*
      {
        "err": "",
        "lastID": res.lastID,
      }
  except:
    res_string = $ %*
      {
        "err": getCurrentExceptionMsg(),
        "lastID": 0,
      }
  GC_ref(res_string)
  result = res_string
  logging.debug("run: ", query, " params: ", params_json, " -> ", result)

proc jsonStringToStringSeq(jsonstring:cstring):seq[string] =
  ## Convert a C string containing a JSON-encoded array of strings
  ## into a sequence of strings.
  runnableExamples:
    let res = jsonStringToStringSeq("""["hi", "ho"]""")
    assert res == @["hi", "ho"]
  let node = parseJson($jsonstring)
  doAssert node.kind == JArray
  for item in node.items:
    result.add(item.getStr())

proc buckets_db_execute_many_json*(budget_handle:int, queries_json:cstring):cstring {.exportc.} =
  ## Perform multiple queries and return an error as a string if there is one
  var queries:seq[string]
  var res_string:string = ""
  try:
    queries = jsonStringToStringSeq(queries_json)
  except AssertionError:
    return getCurrentExceptionMsg()
  
  let db = budget_handle.getBudgetFile().db
  try:
    db.executeMany(queries)
  except:
    res_string = getCurrentExceptionMsg()
  GC_ref(res_string)
  result = res_string
  logging.debug("many: ", $queries, " -> ", result)
