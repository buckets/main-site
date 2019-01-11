import unittest
import os
import strformat
import buckets/clib
import buckets/db
import json

test "buckets_db_all_json":
  let db = buckets_openfile(":memory:")
  let rows = buckets_db_all_json(db, "SELECT 1 as foo, 2 as bar", "[]")
  check rows == """{"err":"","cols":["foo","bar"],"rows":[["1","2"]],"types":["Int","Int"]}"""

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
    check params == @[P(1.5), Pnull]
  
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
    check params == @[P(2.4), Pnull, P(2)]
