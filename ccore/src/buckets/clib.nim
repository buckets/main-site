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
    for fn in LOG_FUNCTIONS:
      fn(ln)

#-----------------------------------

proc jsonStringToStringSeq(jsonstring:cstring):seq[string] =
  ## Convert a C string containing a JSON-encoded array of strings
  ## into a sequence of strings.
  runnableExamples:
    let res = jsonStringToStringSeq("""["hi", "ho"]""")
    assert res == @["hi", "ho"]
  let
    node = parseJson($jsonstring)
  doAssert node.kind == JArray
  for item in node.items:
    result.add(item.getStr())

#-----------------------------------
# C-friendly named Nim functions
#-----------------------------------

proc buckets_version*():cstring {.exportc.} =
  ## Return the current buckets lib version
  PACKAGE_VERSION

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

proc buckets_db_param_array_json*(budget_handle:int, query:cstring):cstring {.exportc.} =
  ## Given an SQL query, return a JSON string array of the
  ## order that named params should be passed in as an array of args
  # runnableExamples:
  #   let db = buckets_openfile(":memory:")
  #   let r = buckets_db_param_array_json(db, "SELECT $face, $name, $face")
  #   assert r == """["$face", "$name"]"""
  let db = budget_handle.getBudgetFile().db
  var
    sqlite_stmt: Pstmt
    params: seq[string]
  if prepare_v2(db, query, query.len.cint, sqlite_stmt, nil) == SQLITE_OK:
    for i in 1..bind_parameter_count(sqlite_stmt):
      params.add($bind_parameter_name(sqlite_stmt, i))
  return $ %* params

proc buckets_db_all_json*(budget_handle:int, query:cstring, params_json:cstring):cstring {.exportc.} =
  ## Perform a query and return the result as a JSON string
  ##    params_json should be an array of strings encoded as a JSON string
  logging.debug(&"db_all_json: {query}")
  logging.debug(&"params_json: {params_json}")
  var params:seq[string]
  try:
    params = jsonStringToStringSeq(params_json)
    logging.debug(&"params: {params}")
    let
      db = budget_handle.getBudgetFile().db
      res = db.fetchAll(sql($query), params)
    let j = %*
      {
        "err": "",
        "cols": res.cols,
        "rows": res.rows,
        "types": res.types,
      }
    result = $j
  except:
    return $ %*
      {
        "err": getCurrentExceptionMsg(),
        "cols": @[],
        "rows": @[],
        "types": @[],
      }

proc buckets_db_run_json*(budget_handle:int, query:cstring, params_json:cstring):cstring {.exportc.} =
  ## Perform a query and return any error/lastID as a JSON string.
  var params:seq[string]
  try:
    params = jsonStringToStringSeq(params_json)
    let
      db = budget_handle.getBudgetFile().db
      res = db.runQuery(sql($query), params)
    let j = %*
      {
        "err": "",
        "lastID": res.lastID,
      }
    result = $j
  except:
    return $ %*
      {
        "err": getCurrentExceptionMsg(),
        "lastID": 0,
      }

proc buckets_db_execute_many_json*(budget_handle:int, queries_json:cstring):cstring {.exportc.} =
  ## Perform multiple queries and return an error as a string if there is one
  var queries:seq[string]
  try:
    queries = jsonStringToStringSeq(queries_json)
  except AssertionError:
    return getCurrentExceptionMsg()
  let
    db = budget_handle.getBudgetFile().db
  try:
    db.executeMany(queries)
  except:
    result = getCurrentExceptionMsg()
