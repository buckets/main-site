## Main entrypoint for buckets C library
import db_sqlite
import buckets/budgetfile
import buckets/dbschema
import buckets/db
import strformat
import strutils
import tables
import sequtils

export openBudgetFile, close
export db

const PACKAGE_VERSION* = toSeq(
  slurp"../buckets.nimble".splitLines()
).filterIt(
  it.startsWith("version"))[0].split('"')[1]

type
  Commands* = enum
    Unknown,
    Echo,
    Exec,

proc stringRPC*(command:string, arg:string):string =
  ## String-based RPC interface
  let cmd = parseEnum(command, Unknown)
  case cmd
  of Echo:
    result = arg
  of Exec:
    result = "Not implemented yet"
  of Unknown:
    result = "Unknown function"
