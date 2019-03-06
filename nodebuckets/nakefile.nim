import nake
import sequtils
import strformat
import times

type
  BuildMode = enum
    Release,
    Debug,
var
  mode:BuildMode = Release

var
  build_flags:seq[string] = @["--header", "--gc:regions", "--dynlibOverride:sqlite3"]
  compiler:string
  osname:string
  libnames:seq[string]

when defined(windows):
  osname = "win"
  compiler = "cpp"
  build_flags.add(@[
    "--app:staticlib",
    "--cc:vcc",
    "--verbosity:2",
    # "--passC:/MD", "--passL:/MD", 
    "--dynlibOverride:sqlite3_32", "--dynlibOverride:sqlite3_64",
  ])
  var
    libname32 = "clib"/"win"/"buckets32.dll"
    libname64 = "clib"/"win"/"buckets64.dll"
  libnames.add(libname32)
  libnames.add(libname64)
elif defined(macosx):
  osname = "mac"
  compiler = "cpp"
  build_flags.add(["--app:staticlib"])
  let libname = "clib"/"mac"/"libbuckets.a"
  libnames.add(libname)
else:
  osname = "linux"
  compiler = "cpp"
  build_flags.add(["--app:staticlib"])
  let libname = "clib"/"linux"/"libbuckets.a"
  libnames.add(libname)

#------------------------------------------------------
# nake verbose addition
#------------------------------------------------------
var taskstack:seq[string]
template task(name, description: string; body: untyped): untyped =
  nake.task(name, description):
    taskstack.add(name)
    echo "[nake] " & currentSourcePath() & " START " & taskstack.join(".")
    body
    echo "[nake] " & currentSourcePath() & "  END  " & taskstack.join(".")
    discard taskstack.pop()

template log(x:varargs[untyped]) =
  stdout.write("[nake] I " & taskstack.join(".") & " - ")
  echo x
#------------------------------------------------------
# end nake verbose addition
#------------------------------------------------------

proc olderThan(targets: seq[string], src: varargs[string]): bool {.raises: [OSError].} =
  ## Returns true if any ``src`` is newer than the oldest ``targets``.
  ##
  ## .. code-block:: nimrod
  ##   import nake, os
  ##
  ##   let
  ##     src = @["prog.nim", "prog2.nim"]
  ##     dst = @["prog.out", "prog_stats.txt"]
  ##   if dst.olderThan(src):
  ##      echo "Refreshing ..."
  ##      # do something to generate the outputs
  ##   else:
  ##      echo "All done!"
  assert len(targets) > 0, "Pass some targets to check"
  assert len(src) > 0, "Pass some source files to check"
  var minTargetTime: float = -1
  for target in targets:
    try:
      let targetTime = toSeconds(getLastModificationTime(target))
      if minTargetTime == -1:
        minTargetTime = targetTime
      elif targetTime < minTargetTime:
        minTargetTime = targetTime
    except OSError:
      return true

  for s in src:
    let srcTime = toSeconds(getLastModificationTime(s))
    if srcTime > minTargetTime:
      return true

proc build() =
  runTask "node_modules"
  runTask "nodelib"
  runTask "js"

task defaultTask, "Build":
  build()

task "release", "Build everything in release mode":
  mode = Release
  build()

task "debug", "Build everything in debug mode":
  mode = Debug
  build()

task "clean", "Clean up build artifacts":
  removeDir("csrc")
  removeDir("csrc32")
  removeDir("csrc64")
  removeDir("clib")
  removeDir("build")
  removeDir("lib")
  removeDir("dist")

task "test", "Test JS library":
  build()
  direShell "node", "dist"/"test.js"

#--------------------------------------------------------
# Low level tasks
#--------------------------------------------------------

task "node_modules", "Install node_modules":
  if not dirExists("node_modules"):
    direShell "npm", "i", "--ignore-scripts"

task "nodelib", "Build the .node file":
  runTask "staticlib"
  var sources = @["binding.gyp", "jstonimbinding.cpp"]
  sources.add(libnames)
  when defined(windows):
    if ("lib"/"ia32"/"bucketslib.node").needsRefresh(sources):
      direShell "node-gyp", "clean", "configure", "rebuild", "--arch=ia32", "--verbose"
    if ("lib"/"x64"/"bucketslib.node").needsRefresh(sources):
      direShell "node-gyp", "clean", "configure", "rebuild", "--arch=x64", "--verbose"
  else:
    if ("lib"/"x64"/"bucketslib.node").needsRefresh(sources):
      direShell "node-gyp", "clean", "configure", "rebuild", "--verbose"
  

proc removeSourceFiles(dirname:string) =
  let todelete = toSeq(walkDirRec(dirname)).filterIt(it.endsWith(".o") or it.endsWith(".cpp") or it.endsWith(".c") or it.endsWith(".obj"))
  for filename in todelete:
    removeFile(filename)

task "staticlib", "Build the static lib":
  let nim_src = toSeq(walkDirRec(".."/"ccore"/"src")).filterIt(it.endsWith(".nim"))

  case mode
  of Release:
    log "========= RELEASE build"
    build_flags.add("-d:release")
  of Debug:
    log "========= DEBUG build"
    build_flags.add(@["--checks:on", "-d:useSysAssert", "-d:useGcAssert"])
  
  if libnames.olderThan(nim_src):
    var args = @[nimExe, compiler]
    args.add(build_flags)
    when defined(windows):
      # 64bit
      var args64 = args
      args64.add("--cpu:amd64")
      args64.add("--nimcache:csrc64")
      args64.add(&"-o:{libname64}")
      args64.add(".."/"ccore"/"src"/"buckets"/"clib.nim")
      log "64 bit args: ", args64
      direShell args64
      copyFile(".."/"ccore"/"src"/"buckets"/"sqlite3"/"sqlite3.c", "csrc64"/"sqlite3.c")
      copyFile(".."/"ccore"/"src"/"buckets"/"sqlite3"/"sqlite3.h", "csrc64"/"sqlite3.h")

      # 32bit
      var args32 = args
      args32.add("--cpu:i386")
      args32.add("--nimcache:csrc32")
      args32.add(&"-o:{libname32}")
      args32.add(".."/"ccore"/"src"/"buckets"/"clib.nim")
      log "32 bit args: ", args32
      direShell args32
      copyFile(".."/"ccore"/"src"/"buckets"/"sqlite3"/"sqlite3.c", "csrc32"/"sqlite3.c")
      copyFile(".."/"ccore"/"src"/"buckets"/"sqlite3"/"sqlite3.h", "csrc32"/"sqlite3.h")

    else:
      args.add("--nimcache:csrc")
      args.add(&"-o:{libname}")
      args.add(".."/"ccore"/"src"/"buckets"/"clib.nim")
      direShell args
      removeSourceFiles("csrc")

task "js", "Build JS files":
  let
    ts_files = toSeq(walkDirRec("jssrc")).filterIt(it.endsWith(".ts"))
    js_files = ts_files.mapIt(it.replace(".ts", ".js").replace("jssrc"/"", "dist"/""))
  if js_files.olderThan(ts_files):
    direShell "tsc"
