import unittest
import os
import strformat
import buckets/clib

test "buckets_db_param_array_json":
  let db = buckets_openfile(":memory:")
  let param_array = buckets_db_param_array_json(db, "SELECT $face, $name, $face")
  check param_array == """["$face","$name"]"""

test "buckets_db_all_json":
  let db = buckets_openfile(":memory:")
  let rows = buckets_db_all_json(db, "SELECT 1 as foo, 2 as bar", "[]")
  check rows == """{"err":"","cols":["foo","bar"],"rows":[["1","2"]],"types":["Int","Int"]}"""
