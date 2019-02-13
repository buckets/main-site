{.compile: "./sqlite3/sqlite3.c" .}
# {.passC: "-D SQLITE_ENABLE_JSON1" .}
# {.passC: "-D SQLITE_THREADSAFE=0" .}
# {.passC: "-D SQLITE_DEFAULT_MEMSTATUS=0" .}
# {.passC: "-D SQLITE_DEFAULT_WAL_SYNCHRONOUS=1" .}
# {.passC: "-D SQLITE_LIKE_DOESNT_MATCH_BLOBS" .}
# {.passC: "-D SQLITE_MAX_EXPR_DEPTH=0" .}
# # {.passC: "-D SQLITE_OMIT_DECLTYPE" .}
# {.passC: "-D SQLITE_OMIT_DEPRECATED" .}
# {.passC: "-D SQLITE_OMIT_PROGRESS_CALLBACK" .}
# {.passC: "-D SQLITE_OMIT_SHARED_CACHE" .}
# {.passC: "-D SQLITE_USE_ALLOCA" .}
# {.passC: "-D SQLITE_ENABLE_COLUMN_METADATA" .}

{.passC: "-D SQLITE_ENABLE_DBSTAT_VTAB" .}
{.passC: "-D SQLITE_ENABLE_FTS3" .}
{.passC: "-D SQLITE_ENABLE_FTS5" .}
{.passC: "-D SQLITE_ENABLE_JSON1" .}
{.passC: "-D SQLITE_ENABLE_RTREE" .}
{.passC: "-D SQLITE_ENABLE_STMTVTAB" .}
{.passC: "-D SQLITE_ENABLE_UNKNOWN_SQL_FUNCTION" .}
{.passC: "-D SQLITE_THREADSAFE=2" .}
{.passC: "-D SQLITE_ENABLE_COLUMN_METADATA" .}

# {.passC: "-D SQLITE_THREADSAFE=1" .}
# {.passC: "-D SQLITE_ENABLE_FTS3" .}
# {.passC: "-D SQLITE_ENABLE_FTS4" .}
# {.passC: "-D SQLITE_ENABLE_FTS5" .}
# {.passC: "-D SQLITE_ENABLE_JSON1" .}
# {.passC: "-D SQLITE_ENABLE_RTREE" .}

import ./util

import logging
import sqlite3
import strutils
import strformat
import json

import db_sqlite
export db_sqlite
export sqlite3

type
  DataType* = enum
    Null,
    Int,
    Float,
    Text,
    Bool,
    Blob,
  Param* = ref ParamObj
  ParamObj {.acyclic.} = object
    case kind*: DataType
    of Int:
      intval*: BiggestInt
    of Float:
      floatval*: BiggestFloat
    of Text:
      textval*: string
    of Blob:
      blobval*: string
    of Bool:
      boolval*: bool
    of Null:
      nil
    
  AllResult* = object
    rows*: seq[seq[string]]
    cols*: seq[string]
    types*: seq[string]

  RunResult* = object
    lastID*: int64

proc newParam*(x:string):Param =
  new(result)
  result.kind = Text
  result.textval = x

proc newParam*(x: int):Param =
  new(result)
  result.kind = Int
  result.intval = x

proc newParam*(x:float):Param =
  new(result)
  result.kind = Float
  result.floatval = x

proc newParam*(x: type(nil)):Param =
  new(result)
  result.kind = Null

proc newParam*(x: bool):Param =
  new(result)
  result.kind = Bool
  result.boolval = x

template P*(x:untyped):untyped = newParam(x)

proc `==`*(a, b: Param):bool =
  ## Check two params for equality
  if a.isNil:
    if b.isNil: return true
    return false
  elif b.isNil or a.kind != b.kind:
    return false
  else:
    case a.kind
    of Blob:
      result = a.blobval == b.blobval
    of Float:
      result = a.floatval == b.floatval
    of Int:
      result = a.intval == b.intval
    of Null:
      result = true
    of Text:
      result = a.textval == b.textval
    of Bool:
      result = a.boolval == b.boolval

proc prepareAndBindArgs(db:DbConn, query:SqlQuery, params: varargs[Param, `newParam`]):Pstmt =
  let querystring = query.string
  if db.prepare_v2(querystring, querystring.len.cint, result, nil) != SQLITE_OK:
    dbError(db)
  if clear_bindings(result) != SQLITE_OK:
    dbError(db)
  for i,param in params:
    case param.kind
    of Text:
      if result.bind_text((i+1).cint, param.textval, param.textval.len.cint, SQLITE_STATIC) != SQLITE_OK:
        dbError(db)
    of Null:
      if result.bind_null((i+1).cint) != SQLITE_OK:
        dbError(db)
    of Int:
      if result.bind_int64((i+1).cint, param.intval) != SQLITE_OK:
        dbError(db)
    of Float:
      if result.bind_double((i+1).cint, param.floatval) != SQLITE_OK:
        dbError(db)
    of Bool:
      if result.bind_int64((i+1).cint, if param.boolval: 1 else: 0) != SQLITE_OK:
        dbError(db)
    of Blob:
      raise newException(CatchableError, &"Unbindable data type: {param.kind}")

iterator queryRows(db:DbConn, query:SqlQuery, params: varargs[Param, `newParam`]): InstantRow =
  var pstmt = db.prepareAndBindArgs(query, params)
  while step(pstmt) == SQLITE_ROW:
    yield pstmt
  if finalize(pstmt) != SQLITE_OK:
    dbError(db)

proc fetchAll*(db:DbConn, statement:SqlQuery, params: varargs[Param, `newParam`]): ref AllResult =
  ## Execute a multi-row-returning SQL statement.
  new(result)
  for row in db.queryRows(statement, params):
    var res:seq[string]
    # XXX do this outside of the loop by passing columns in to queryRows
    let L = column_count(row)
    if result.cols.len == 0:
      for coli in 0'i32 ..< L:
        result.cols.add($column_name(row, coli))
        case column_type(row, coli)
        of SQLITE_INTEGER:
          result.types.add("Int")
        of SQLITE_NULL:
          result.types.add("Null")
        of SQLITE_TEXT:
          result.types.add("Text")
        of SQLITE_FLOAT:
          result.types.add("Float")
        of SQLITE_BLOB:
          result.types.add("Blob")
        else:
          result.types.add("Null")
    for coli in 0'i32 ..< L:
      let val = column_text(row, coli)
      res.add(cStringToString(val, val.len.cint))
    result.rows.add(res)

proc runQuery*(db:DbConn, query:SqlQuery, params: varargs[Param, `newParam`]): ref RunResult =
  ## Execute an SQL statement.
  ## If there was an error running the statement, .err will be non-empty.
  ## If it was a successful INSERT statement, .lastID will be the id of the last inserted row
  new(result)
  assert(not db.isNil, "Database not connected.")
  var pstmt = db.prepareAndBindArgs(query, params)
  if pstmt.step() in {SQLITE_DONE, SQLITE_ROW}:
    result.lastID = last_insert_rowid(db)
    if finalize(pstmt) != SQLITE_OK:
      dbError(db)

proc executeMany*(db:DbConn, statements:openArray[string]) =
  ## Execute many SQL statements.
  ## Return any error as a string.
  for s in statements:
    db.exec(sql(s))

