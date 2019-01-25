import unittest
import os
import strformat
import buckets/clib
import buckets/db
import json

test "buckets_db_all_json":
  let db = buckets_openfile(":memory:")
  let rows = strres buckets_db_all_json(db, "SELECT 1 as foo, 2 as bar", "[]")
  check rows == """{"err":"","cols":["foo","bar"],"rows":[["1","2"]],"types":["Int","Int"]}"""

test "everything":
  check strres(buckets_version()) != ""
  let db = buckets_openfile(":memory:")
  echo strres buckets_db_all_json(db, "SELECT 1,2,3", "[]")
  echo strres buckets_db_all_json(db, "SELECT 1,2,3", "{}")
  echo strres buckets_db_all_json(db, "SELECT 1, sd'f", "[]")
  discard strres buckets_db_execute_many_json(db, """[
    "CREATE TABLE customer (id INTEGER PRIMARY KEY, email TEXT)",
    "CREATE TABLE company (id INTEGER PRIMARY KEY, name TEXT)"
  ]""")
  echo "about to insert"
  let res = parseJson(strres buckets_db_run_json(db, "INSERT INTO company (name) VALUES ('MartinCo')", "[]"))
  check res["lastID"].getInt() == 1


suite "jsonToParams":

  test "seq text":
    let db = buckets_openfile(":memory:").toDB
    let params = db.json_to_params("SELECT $foo, $bar", "[\"something\",\"another\"]")
    check params == @[P("something"), P("another")]
  
  test "seq int":
    let db = buckets_openfile(":memory:").toDB
    let params = db.json_to_params("SELECT $foo, $bar", "[\"something\",2]")
    check params == @[P("something"), P(2)]
  
  test "seq float":
    let db = buckets_openfile(":memory:").toDB
    let params = db.json_to_params("SELECT $foo, $bar", "[1.5,\"another\"]")
    check params == @[P(1.5), P("another")]
  
  test "seq null":
    let db = buckets_openfile(":memory:").toDB
    let params = db.json_to_params("SELECT $foo, $bar", "[1.5,null]")
    check params == @[P(1.5), P(nil)]
  
  test "obj text":
    let db = buckets_openfile(":memory:").toDB
    let params = db.json_to_params(
      "SELECT $foo, $bar", $ %* {
        "$bar": "something",
        "$foo": "hello",
      })
    check params == @[P("hello"), P("something")]
  
  test "obj int float null":
    let db = buckets_openfile(":memory:").toDB
    let params = db.json_to_params(
      "SELECT $banana, $apple, $car", $ %* {
        "$apple": nil,
        "$banana": 2.4,
        "$car": 2,
      })
    check params == @[P(2.4), P(nil), P(2)]
