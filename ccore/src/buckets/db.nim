{.compile: "./sqlite3/sqlite3.c" .}
{.passC: "-dSQLITE_ENABLE_JSON1" .}
{.passC: "-dSQLITE_THREADSAFE=0" .}
{.passC: "-dSQLITE_DEFAULT_MEMSTATUS=0" .}
{.passC: "-dSQLITE_DEFAULT_WAL_SYNCHRONOUS=1" .}
{.passC: "-dSQLITE_LIKE_DOESNT_MATCH_BLOBS" .}
{.passC: "-dSQLITE_MAX_EXPR_DEPTH=0" .}
{.passC: "-dSQLITE_OMIT_DECLTYPE" .}
{.passC: "-dSQLITE_OMIT_DEPRECATED" .}
{.passC: "-dSQLITE_OMIT_PROGRESS_CALLBACK" .}
{.passC: "-dSQLITE_OMIT_SHARED_CACHE" .}
{.passC: "-dSQLITE_USE_ALLOCA" .}
{.passC: "-dSQLITE_ENABLE_COLUMN_METADATA" .}

import logging
import sqlite3
import strutils
import strformat

import db_sqlite
export db_sqlite
export sqlite3

type
  DataType = enum
    Unknown,
    Int,
    Float,
    Text,
    Blob,
    Null,
  GetResult* = tuple[
    row: seq[string],
    cols: seq[string],
  ]
  AllResult* = tuple[
    rows: seq[seq[string]],
    cols: seq[string],
    types: seq[DataType],
  ]
  RunResult* = tuple[
    lastID: int64,
  ]

iterator queryRows(db:DbConn, query:SqlQuery, params:seq[string] = @[]): InstantRow =
  let
    querystring = query.string;
  var
    pstmt:Pstmt
  if db.prepare_v2(querystring, querystring.len.cint, pstmt, nil) != SQLITE_OK:
    dbError(db)
  for i in 0 ..< params.len:
    if pstmt.bind_text((i+1).cint, params[i].cstring, params[i].len.cint, SQLITE_STATIC) != SQLITE_OK:
      dbError(db)
  while step(pstmt) == SQLITE_ROW:
    yield pstmt
  if finalize(pstmt) != SQLITE_OK:
    dbError(db)

proc fetchAll*(db:DbConn, statement:SqlQuery, params:seq[string] = @[]): AllResult =
  ## Execute a multi-row-returning SQL statement.
  for row in db.queryRows(statement, params):
    var res:seq[string]
    # XXX do this outside of the loop
    let L = column_count(row)
    if result.cols.len == 0:
      for coli in 0'i32 ..< L:
        result.cols.add($column_name(row, coli))
        case column_type(row, coli)
        of SQLITE_INTEGER:
          result.types.add(Int)
        of SQLITE_NULL:
          result.types.add(Null)
        of SQLITE_TEXT:
          result.types.add(Text)
        of SQLITE_FLOAT:
          result.types.add(Float)
        of SQLITE_BLOB:
          result.types.add(Blob)
        else:
          result.types.add(Unknown)
    for coli in 0'i32 ..< L:
      res.add(row[coli])
    result.rows.add(res)

proc runQuery*(db:DbConn, query:SqlQuery, params:seq[string] = @[]): RunResult =
  ## Execute an SQL statement.
  ## If there was an error running the statement, .err will be non-empty.
  ## If it was a successful INSERT statement, .lastID will be the id of the last inserted row
  assert(not db.isNil, "Database not connected.")
  let
    querystring = query.string;
  var
    pstmt:Pstmt
  if db.prepare_v2(querystring, querystring.len.cint, pstmt, nil) != SQLITE_OK:
    dbError(db)
  for i in 0 ..< params.len:
    if pstmt.bind_text((i+1).cint, params[i].cstring, params[i].len.cint, SQLITE_STATIC) != SQLITE_OK:
      dbError(db)

  if pstmt.step() in {SQLITE_DONE, SQLITE_ROW}:
    result.lastID = last_insert_rowid(db)
    if finalize(pstmt) != SQLITE_OK:
      dbError(db)

proc executeMany*(db:DbConn, statements:openArray[string]) =
  ## Execute many SQL statements.
  ## Return any error as a string.
  for s in statements:
    db.exec(sql(s))
    
