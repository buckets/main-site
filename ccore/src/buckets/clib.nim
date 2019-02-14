## This file contains the C interface to the buckets library
## It mostly does this:
##  - wraps other library functions in buckets_ prefixed names
##  - provides access to log messages emitted by Nim
import ./db
import ./budgetfile
import ../buckets
import ./util
import strformat
import strutils
import sequtils
import json
import logging

var myRegion: MemRegion

{.passC: "-fPIC" .}

#-----------------------------------
# String-returning helpers
#-----------------------------------
var
  LAST_STRING:string
  HAS_LAST_STRING:bool

proc setReturnString(x:string):csize =
  withRegion(myRegion):
    if HAS_LAST_STRING:
      raise newException(CatchableError, "Return string was not used/discarded")
    LAST_STRING = x
    HAS_LAST_STRING = true
    # echo "RETURN STRING: ", LAST_STRING
    return x.len.csize

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
  withRegion(myRegion):
    return budget_handle.getBudgetFile().db

template strres*(x:untyped):untyped =
  discard x
  HAS_LAST_STRING = false
  LAST_STRING

#-----------------------------------
# C-friendly named Nim functions
#-----------------------------------

proc buckets_get_result_string*(p:pointer) {.exportc.} =
  ## Write the last result string to a location in memory
  withRegion(myRegion):
    assert HAS_LAST_STRING
    if LAST_STRING.len > 0:
      moveMem(p, LAST_STRING.cstring, LAST_STRING.len)
    HAS_LAST_STRING = false

proc buckets_discard_result_string*() {.exportc.} =
  ## Discard the last result string
  withRegion(myRegion):
    assert HAS_LAST_STRING
    LAST_STRING = ""
    HAS_LAST_STRING = false

proc buckets_version*():csize {.exportc.} =
  ## Return the current buckets lib version
  withRegion(myRegion):
    return setReturnString(PACKAGE_VERSION)

# proc buckets_stringpc*(command:cstring, arg:cstring, arglen:int):cstring {.exportc.} =
#   ## String-based RPC interface
#   var fullarg:string
#   fullarg = newString(arglen)
#   copyMem(fullarg[0].unsafeAddr, arg, arglen)
#   result = stringRPC(cStringToString(command), fullarg)

proc buckets_register_logger*(fn:LogFunc) {.exportc.} =
  ## Register a function to receive logging events from Nim.
  ## The function will be called with strings to be logged.
  withRegion(myRegion):
    LOG_FUNCTIONS.add(fn)
    if LOG_FUNCTIONS.len == 1:
      var logger:FunctionLogger
      new(logger)
      addHandler(logger)

proc buckets_openfile*(filename:cstring, filenameL:cint):cint {.exportc.} =
  ## Open a budget file
  withRegion(myRegion):
    return openBudgetFile(cStringToString(filename, filenameL)).id.cint

template buckets_openfile*(filename:cstring):cint =
  buckets_openfile(filename, filename.len.cint)

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
  withRegion(myRegion):
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

proc buckets_db_all_json*(budget_handle:int, query:cstring, queryL:cint, params_json:cstring, params_jsonL:cint):csize {.exportc.} =
  ## Perform a query and return the result as a JSON string
  ##    params_json should be a JSON-encoded array/object
  withRegion(myRegion):
    var
      query = cStringToString(query, queryL)
      params_json = cStringToString(params_json, params_jsonL)
      res_string:string
    try:
      let db = budget_handle.getBudgetFile().db
      let params = db.json_to_params(query, params_json)
      let res = db.fetchAll(sql(query), params)
      # var j = %* {
      #   "err": "",
      #   "cols": res.cols,
      #   "rows": res.rows,
      #   "types": res.types,
      # }
      
      var j = newJObject()
      var jcols = newJArray()
      for col in res.cols:
        jcols.add(newJString(col))
      var jrows = newJArray()
      # echo "hi", query.repr
      var i = 0
      for row in res.rows:
        # if query.startsWith("pragma table_info(bucket)"):
        #   echo "row: ", row.repr
        var jrow = newJArray()
        var c = 0
        for col in row:
          if col.startsWith("\0\0"):
            echo "STARTS WITH NULL"
            # dumpMem(res.unsafeAddr, 512)
            # echo toHex(cast[int](res.rows[5].unsafeAddr))
            echo "res.rows[5][0]: ", res.rows[5][0].repr
            echo cast[byte](cstring(res.rows[5][0])[0])
            # echo "          addr: ", toHex(cast[int](res.rows[5][0].unsafeAddr))
            # echo "     jrow.addr: ", toHex(cast[int](jrow.addr))
            # echo "    jrows.addr: ", toHex(cast[int](jrows.addr))
            # dumpMem(cstring(res.rows[5][0]), 128)
            # dumpMem(res.rows[5][0].unsafeAddr, 32)
            # echo "res.rows[4]: ", res.rows[4].repr
            # echo "res.rows[3]: ", res.rows[3].repr
            # dumpMem(res.rows[5].unsafeAddr, 32)
            # dumpMem(res.rows[5].unsafeAddr, 256)
            # echo "res.rows[5]: ", res.rows[5].repr
            # echo "res.rows[6]: ", res.rows[6].repr
            # echo "res.rows[7]: ", res.rows[7].repr
            # echo "res.rows[8]: ", res.rows[8].repr
            # echo "res.rows[9]: ", res.rows[9].repr
            # echo "res.rows: ", res.rows.repr
          jrow.add(newJString(col))
          c.inc()
        jrows.add(jrow)
        # if query.startsWith("pragma table_info(bucket)"):
        # echo "jrow"
        i.inc()
      var jtypes = newJArray()
      for t in res.types:
        jtypes.add(newJString(t))
      j.add("err", newJString(""))
      j.add("cols", jcols)
      j.add("rows", jrows)
      j.add("types", jtypes)
      # let i = cast[int](j)
      # stdout.write(cast[int](j), "\n")
      # res_string.toUgly(j)
      res_string = $j
    except:
      var j = newJObject()
      j.add("err", newJString(getStackTrace() & getCurrentExceptionMsg()))
      var cols = newJArray()
      var rows = newJArray()
      var types = newJArray()
      j.add("cols", cols)
      j.add("rows", rows)
      j.add("types", types)
      # res_string.toUgly(j)
      res_string = $j
    return setReturnString(res_string)

template buckets_db_all_json*(budget_handle:int, query:cstring, params_json:cstring):csize =
  buckets_db_all_json(budget_handle, query, query.len.cint, params_json, params_json.len.cint)

proc buckets_db_run_json*(budget_handle:int, query:cstring, queryL:cint, params_json:cstring, params_jsonL:cint):csize {.exportc.} =
  ## Perform a query and return any error/lastID as a JSON string.
  ##    params_json should be a JSON-encoded array/object
  withRegion(myRegion):
    var
      query = cStringToString(query, queryL)
      params_json = cStringToString(params_json, params_jsonL)
      res_string: string
    # echo "buckets_db_run_json"
    # echo "params addr", toHex(cast[int](params_json.addr))
    # echo &"buckets_db_run_json {query} {params_json}"
    try:
      let
        db = budget_handle.getBudgetFile().db
        params = db.json_to_params(query, params_json)
        res = db.runQuery(sql(query), params)
      var j = newJObject()
      j.add("err", newJString(""))
      j.add("lastID", newJInt(res.lastID))
      res_string = $j
    except:
      echo "Error: ", getCurrentExceptionMsg()
      var j = newJObject()
      j.add("err", newJString(getStackTrace() & getCurrentExceptionMsg()))
      j.add("lastID", newJInt(0))
      res_string = $j
    return setReturnString(res_string)

template buckets_db_run_json*(budget_handle:int, query:cstring, params_json:cstring):csize =
  buckets_db_run_json(budget_handle, query, query.len.cint, params_json, params_json.len.cint);

proc jsonStringToStringSeq(jsonstring:string):seq[string] =
  ## Convert a C string containing a JSON-encoded array of strings
  ## into a sequence of strings.
  runnableExamples:
    let res = jsonStringToStringSeq("""["hi", "ho"]""")
    assert res == @["hi", "ho"]
  withRegion(myRegion):
    let node = parseJson(jsonstring)
    doAssert node.kind == JArray
    for item in node.items:
      result.add(item.getStr())

proc buckets_db_execute_many_json*(budget_handle:int, queries_json:cstring, queries_jsonL:cint):csize {.exportc.} =
  ## Perform multiple queries and return an error as a string if there is one
  withRegion(myRegion):
    var
      queries_json = cStringToString(queries_json, queries_jsonL)
      queries:seq[string]
      res_string:string = ""
    
    try:
      queries = jsonStringToStringSeq(queries_json)
    except AssertionError:
      return setReturnString(getStackTrace() & getCurrentExceptionMsg())
    
    let db = budget_handle.getBudgetFile().db
    try:
      db.executeMany(queries)
    except:
      res_string = getStackTrace() & getCurrentExceptionMsg()
    return setReturnString(res_string)

template buckets_db_execute_many_json*(budget_handle:int, queries_json:cstring):csize =
  buckets_db_execute_many_json(budget_handle, queries_json, queries_json.len.cint)
