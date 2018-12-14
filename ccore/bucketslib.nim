import strformat


proc buckets_version*():cstring {.exportc.} =
  "0.1.0"

proc buckets_stringpc*(command:cstring, arg:cstring):cstring {.exportc.} =
  &"Not implemented yet: {command}"
