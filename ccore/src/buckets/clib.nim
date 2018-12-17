## This file contains the C interface to the buckets library
import ../buckets
import strformat
import strutils

#-----------------------------------
# C-friendly named Nim functions
#-----------------------------------

proc buckets_version*():cstring {.exportc.} =
  PACKAGE_VERSION

proc buckets_stringpc*(command:cstring, arg:cstring, arglen:int):cstring {.exportc.} =
  ## String-based RPC interface
  var fullarg:string
  fullarg = newString(arglen)
  copyMem(fullarg[0].unsafeAddr, arg, arglen)
  result = stringRPC($command, fullarg)
