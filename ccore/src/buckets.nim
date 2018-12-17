## Main entrypoint for buckets library
import db_sqlite
import buckets/budgetfile
import buckets/dbschema
import buckets/db
import strformat
import strutils

type
  Commands* = enum
    Unknown,
    Foo,
    Bar,


proc buckets_version*():cstring {.exportc.} =
  "0.1.0"

proc buckets_stringpc*(command:cstring, arg:cstring, arglen:int):cstring {.exportc.} =
  ## String-based RPC interface
  var fullarg:string
  fullarg = newString(arglen)
  copyMem(fullarg[0].unsafeAddr, arg, arglen)
  
  let cmd = parseEnum($command, Unknown)
  case cmd
  of Foo:
    result = &"Foo({fullarg.repr}) executed"
  of Bar:
    var db = db_sqlite.open(":memory:", "", "", "")
    for row in db.instantRows(sql"SELECT sqlite_version()"):
      result = row[0]
    # result = &"Bar({fullarg.repr}) executed"
  of Unknown:
    result = "Unknown function"
