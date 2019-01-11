import unittest
import os
import strformat
import buckets/db

import ./util

proc openDB(name:string):DbConn =
  open(name, "", "", "")

test "runQuery SELECT no params":
  let db = openDB(":memory:")
  let res = db.runQuery(sql"SELECT 1")

test "runQuery INSERT":
  let db = openDB(":memory:")
  discard db.runQuery(sql"CREATE TABLE foo (id INTEGER PRIMARY KEY, name TEXT)")
  let res = db.runQuery(sql"INSERT INTO foo (name) VALUES (?)", @[P("something")])
  check res.lastID == 1

test "runQuery failure":
  let db = openDB(":memory:")
  doAssertRaises(DbError):
    let res = db.runQuery(sql"SELECT slkdflskdjf")

test "runQuery $param":
  let db = openDB(":memory:")
  discard db.runQuery(sql"CREATE TABLE foo (id INTEGER PRIMARY KEY, name TEXT)")
  let res = db.runQuery(sql"INSERT INTO foo (name) VALUES ($name)", @[P("something")])
  check res.lastID == 1

test "runQuery $param null":
  let db = openDB(":memory:")
  discard db.runQuery(sql"SELECT $foo", @[Pnull])

test "executeMany":
  let db = openDB(":memory:")
  db.executeMany([
    "CREATE TABLE foo (name TEXT)",
    "INSERT INTO foo (name) VALUES ('hey')",
  ])
  let res = db.fetchAll(sql"SELECT name FROM foo")
  check res.rows[0][0] == "hey"

test "executeMany error":
  let db = openDB(":memory:")
  doAssertRaises(DbError):
    db.executeMany([
      "CREATE TABLE foo (name TEXT)",
      "INSERT INTO foo (name) garbage VALUES ('hey')",
    ])

test "all":
  let db = openDB(":memory:")
  let res = db.fetchAll(sql"SELECT 1 UNION SELECT 2")
  check res.rows == @[@["1"], @["2"]]

test "all error":
  let db = openDB(":memory:")
  doAssertRaises(DbError):
    discard db.fetchAll(sql"SELECT 1 garbagehey' UNION SELECT 2")

test "all param":
  let db = openDB(":memory:")
  let res = db.fetchAll(sql"SELECT ? UNION SELECT ?", @[P("first"), P("second")])
  check res.rows == @[@["first"], @["second"]]

test "all $param":
  let db = openDB(":memory:")
  let res = db.fetchAll(sql"SELECT $foo UNION SELECT $bar", @[P("first"), P("second")])
  check res.rows == @[@["first"], @["second"]]

test "all $param all datatypes":
  let db = openDB(":memory:")
  let res = db.fetchAll(sql"SELECT $s, $i, $f, $n",
    @[P("string"), P(5), P(4.3), Pnull])
  check res.rows == @[@["string", "5", "4.3", ""]]

test "update sequence":
  let db = openDB(":memory:")
  discard db.runQuery(sql"CREATE TABLE foo (id INTEGER PRIMARY KEY, name TEXT)")
  let res = db.runQuery(sql"INSERT INTO foo (name) values ($name)", @[P("some name")])
  let res2 = db.fetchAll(sql"SELECT id, name FROM foo")
  check res2.rows == @[@["1", "some name"]]
  discard db.runQuery(sql"UPDATE foo SET name = $another", @[P("renamed name")])
  let res3 = db.fetchAll(sql"SELECT id, name FROM foo")
  check res3.rows == @[@["1", "renamed name"]]
