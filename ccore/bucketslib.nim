import strformat
import strutils

type
  Commands* = enum
    Unknown,
    Foo,
    Bar,

proc buckets_version*():cstring {.exportc.} =
  "0.1.0"

proc buckets_stringpc*(command:cstring, arg:cstring, arglen:int = 0):cstring {.exportc.} =
  var fullarg:string
  if arglen > 0:
    fullarg = newString(arglen)
    copyMem(fullarg[0].unsafeAddr, arg, arglen)
  else:
    fullarg = $arg
  let cmd = parseEnum($command, Unknown)
  case cmd
  of Foo:
    result = &"Foo({fullarg.repr}) executed"
  of Bar:
    result = &"Bar({fullarg.repr}) executed"
  of Unknown:
    result = "Unknown function"
