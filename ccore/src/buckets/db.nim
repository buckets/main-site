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

import logging
import sqlite3
import strutils
import strformat

import db_sqlite
export db_sqlite

type
  GetResult* = tuple[
    row: seq[string],
    err: string,
  ]
  AllResult* = tuple[
    rows: seq[seq[string]],
    err: string,
  ]
  RunResult* = tuple[
    lastID: int64,
    err: string,
  ]

proc fetchOne*(db:DbConn, statement:SqlQuery, params:seq[string] = @[]): GetResult =
  ## Execute a row-returning SQL statement.
  for x in db.rows(statement, params):
    result.row = x

proc fetchAll*(db:DbConn, statement:SqlQuery, params:seq[string] = @[]): AllResult =
  ## Execute a multi-row-returning SQL statement.
  try:
    for x in db.fastRows(statement, params):
      result.rows.add(x)
  except DbError:
    result.err = getCurrentExceptionMsg()

proc runQuery*(db:DbConn, statement:SqlQuery, params:seq[string] = @[]): RunResult =
  ## Execute an SQL statement.
  ## If there was an error running the statement, .err will be non-empty.
  ## If it was a successful INSERT statement, .lastID will be the id of the last inserted row
  try:
    db.exec(statement, params)
    result.lastID = last_insert_rowid(db)
  except DbError:
    result.err = getCurrentExceptionMsg()

proc executeMany*(db:DbConn, statements:openArray[string]): string =
  ## Execute many SQL statements.
  ## Return any error as a string.
  try:
    for s in statements:
      db.exec(sql(s))
  except DbError:
    result = getCurrentExceptionMsg()
    
