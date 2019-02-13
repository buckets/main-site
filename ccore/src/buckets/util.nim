import strutils
import terminal

template lowerHex(x:untyped):untyped =
  toHex(x).toLower()

template charRepr(x:byte):char =
  case x
  of 32..126: chr(x)
  else: '.'

template toBytes(p:pointer):untyped =
  cast[ptr UncheckedArray[byte]](p)

proc dumpMem*(p:pointer, N:int, total:int = 0) =
  ## Print out a chunk of memory
  var total = total
  if total < N:
    total = N
  if p == nil:
    echo "WARNING: Attempted to dumpMem on nil pointer"
    return
  var c = 0
  while c < total:
    stdout.resetAttributes()
    stdout.write(lowerHex(cast[int](toBytes(p)) + c))
    stdout.write("  ")
    if c < N:
      stdout.setStyle({styleBright})
    for i in 0 ..< 8:
      if c >= N:
        stdout.resetAttributes()
      stdout.write(lowerHex(toBytes(p)[c]))
      stdout.write(" ")
      c.inc()
    stdout.write(" ")
    for i in 0 ..< 8:
      if c >= N:
        stdout.resetAttributes()
      stdout.write(lowerHex(toBytes(p)[c]))
      stdout.write(" ")
      c.inc()
    stdout.resetAttributes()
    stdout.write(" |")
    for i in 0 ..< 16:
      let n = c-16+i
      if n >= N:
        stdout.resetAttributes()
      else:
        stdout.setStyle({styleBright})
      stdout.write(charRepr(toBytes(p)[n]))
    stdout.resetAttributes()
    stdout.write("|\L")
  stdout.write("\L")

# template dumpMem*(c:cstring) =
#   dumpMem(c.unsafeAddr, c.len)

proc cStringToString*(x:cstring, n:cint):string =
  if x == nil:
    result = ""
  else:
    result = newString(n)
    copyMem(unsafeAddr(result[0]), x, n)


