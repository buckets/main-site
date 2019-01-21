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

echo "clib initialized"

#-----------------------------------
# String-returning helpers
#-----------------------------------
var STRINGS_TO_CLEAR:seq[string]
template clearOldStrings():untyped =
  discard
  # while STRINGS_TO_CLEAR.len > 0:
  #   discard STRINGS_TO_CLEAR.pop()

proc keepString(x:string):string = 
  if x != "":
    STRINGS_TO_CLEAR.add(x)
  result = x

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

proc toDB*(budget_handle:int):DbConn =
  budget_handle.getBudgetFile().db

proc cStringToString(x:cstring):string =
  var res = newString(x.len)
  copyMem(unsafeAddr(res[0]), x, x.len)
  res

#-----------------------------------
# C-friendly named Nim functions
#-----------------------------------

proc buckets_version*():cstring {.exportc.} =
  ## Return the current buckets lib version
  clearOldStrings
  PACKAGE_VERSION

proc buckets_stringpc*(command:cstring, arg:cstring, arglen:int):cstring {.exportc.} =
  ## String-based RPC interface
  var fullarg:string
  fullarg = newString(arglen)
  copyMem(fullarg[0].unsafeAddr, arg, arglen)
  result = stringRPC(cStringToString(command), fullarg)

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

proc json_to_params*(db:DbConn, query:string, params_json:string):seq[Param] =
  ## Convert a JSON Object or Array of query parameters into
  ## a sequence of Params suitable for using in a query.
  let parsed = parseJson(params_json)
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
  clearOldStrings
  echo &"buckets_db_all_json {query} {params_json}"
  var
    query = cStringToString(query)
    params_json = cStringToString(params_json)
  var res_string:string = ""
  try:
    let db = budget_handle.getBudgetFile().db
    let params = db.json_to_params(query, params_json)
    let res = db.fetchAll(sql(query), params)
    var j = newJObject()
    
    var jcols = newJArray()
    for col in res.cols:
      echo "Adding col to json"
      jcols.add(newJString(col))
    var jrows = newJArray()
    for row in res.rows:
      echo "Adding {row} row to json"
      var jrow = newJArray()
      for col in row:
        echo "Adding {col} row col to json"
        jrow.add(newJString(col))
      echo "Adding jrow to jrows"
      jrows.add(jrow)
    var jtypes = newJArray()
    for t in res.types:
      echo "Adding {t} to json"
      jtypes.add(newJString(t))
    echo "Setting err to empty"
    j.add("err", newJString(""))
    echo "Setting cols to jcols"
    j.add("cols", jcols)
    echo "Setting rows to jrows"
    j.add("rows", jrows)
    echo "Setting types to jtypes"
    j.add("types", jtypes)
    echo "Uglifying"
    toUgly(res_string, j)
  except:
    var j = newJObject()
    j.add("err", newJString(getCurrentExceptionMsg()))
    var cols = newJArray()
    var rows = newJArray()
    var types = newJArray()
    j.add("cols", cols)
    j.add("rows", rows)
    j.add("types", types)
    toUgly(res_string, j)
  result = keepString(res_string)
  # logging.debug("all: ", query, " ", params_json, " -> ", result)

proc buckets_db_run_json*(budget_handle:int, query:cstring, params_json:cstring):cstring {.exportc.} =
  ## Perform a query and return any error/lastID as a JSON string.
  ##    params_json should be a JSON-encoded array/object
  clearOldStrings
  echo &"buckets_db_run_json {query} {params_json}"
  var
    query = cStringToString(query)
    params_json = cStringToString(params_json)
  var res_string:string
  try:
    let
      db = budget_handle.getBudgetFile().db
      params = db.json_to_params(query, params_json)
      res = db.runQuery(sql(query), params)
    var j = newJObject()
    j.add("err", newJString(""))
    j.add("lastID", newJInt(res.lastID))
    toUgly(res_string, j)
  except:
    var j = newJObject()
    j.add("err", newJString(getCurrentExceptionMsg()))
    j.add("lastID", newJInt(0))
    toUgly(res_string, j)
  result = keepString(res_string)
  # logging.debug("run: ", query, " ", params_json, " -> ", result)

proc jsonStringToStringSeq(jsonstring:cstring):seq[string] =
  ## Convert a C string containing a JSON-encoded array of strings
  ## into a sequence of strings.
  runnableExamples:
    let res = jsonStringToStringSeq("""["hi", "ho"]""")
    assert res == @["hi", "ho"]
  
  var
    jsonstring = cStringToString(jsonstring)
  let node = parseJson(jsonstring)
  doAssert node.kind == JArray
  for item in node.items:
    result.add(item.getStr())

proc buckets_db_execute_many_json*(budget_handle:int, queries_json:cstring):cstring {.exportc.} =
  ## Perform multiple queries and return an error as a string if there is one
  clearOldStrings
  echo &"buckets_db_execute_many_json {queries_json}"
  var queries:seq[string]
  var res_string:string = ""
  try:
    queries = jsonStringToStringSeq(queries_json)
  except AssertionError:
    result = keepString(getCurrentExceptionMsg())
    return
  
  let db = budget_handle.getBudgetFile().db
  try:
    db.executeMany(queries)
  except:
    res_string = getCurrentExceptionMsg()
  result = keepString(res_string)
