import unittest
import os
import strformat
import buckets/db

import ./util

proc openDB(name:string):DbConn =
  open(name, "", "", "")

test "fetchOne":
  let db = openDB(":memory:")
  let res = db.fetchOne(sql"SELECT 1")
  check res.err == ""
  check res.row == @["1"]

test "fetchOne not found":
  let db = openDB(":memory:")
  discard db.runQuery(sql"CREATE TABLE foo (name TEXT)")
  let res = db.fetchOne(sql"SELECT name FROM foo")
  check res.err == ""
  check res.row == []

test "fetchOne param":
  let db = openDB(":memory:")
  let res = db.fetchOne(sql"SELECT ?", @["2"])
  check res.err == ""
  check res.row == @["2"]

test "runQuery SELECT no params":
  let db = openDB(":memory:")
  let res = db.runQuery(sql"SELECT 1")
  check res.err == ""

test "runQuery INSERT":
  let db = openDB(":memory:")
  discard db.runQuery(sql"CREATE TABLE foo (id INTEGER PRIMARY KEY, name TEXT)")
  let res = db.runQuery(sql"INSERT INTO foo (name) VALUES (?)", @["something"])
  check res.lastID == 1
  check res.err == ""

test "runQuery failure":
  let db = openDB(":memory:")
  let res = db.runQuery(sql"SELECT slkdflskdjf")
  check res.err != ""
  echo res.err

test "executeMany":
  let db = openDB(":memory:")
  let err = db.executeMany([
    "CREATE TABLE foo (name TEXT)",
    "INSERT INTO foo (name) VALUES ('hey')",
  ])
  check err == ""
  let res = db.fetchOne(sql"SELECT name FROM foo")
  check res.row[0] == "hey"

test "executeMany error":
  let db = openDB(":memory:")
  let err = db.executeMany([
    "CREATE TABLE foo (name TEXT)",
    "INSERT INTO foo (name) garbage VALUES ('hey')",
  ])
  check err != ""

test "all":
  let db = openDB(":memory:")
  let res = db.fetchAll(sql"SELECT 1 UNION SELECT 2")
  check res.err == ""
  check res.rows == @[@["1"], @["2"]]

test "all error":
  let db = openDB(":memory:")
  let res = db.fetchAll(sql"SELECT 1 garbagehey' UNION SELECT 2")
  check res.err != ""
  check res.rows == []

test "all param":
  let db = openDB(":memory:")
  let res = db.fetchAll(sql"SELECT ? UNION SELECT ?", @["first", "second"])
  check res.err == ""
  check res.rows == @[@["first"], @["second"]]
