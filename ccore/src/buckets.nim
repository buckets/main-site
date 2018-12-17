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

const PACKAGE_VERSION* = toSeq(
  slurp"../buckets.nimble".splitLines()
).filterIt(
  it.startsWith("version"))[0].split('"')[1]

type
  Commands* = enum
    Unknown,
    Echo,

proc stringRPC*(command:string, arg:string):string =
  ## String-based RPC interface
  
  let cmd = parseEnum(command, Unknown)
  case cmd
  of Echo:
    result = arg
  of Unknown:
    result = "Unknown function"
