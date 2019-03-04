import nake
import sequtils
import times

type
  BuildMode = enum
    Release,
    Debug,
var
  mode:BuildMode = Release

var
  build_flags:seq[string] = @["--header", "--gc:regions"]
  compiler:string
  osname:string
  libname:string

when defined(windows):
  osname = "win"
  compiler = "cpp"
  build_flags.add(@["--compileOnly", "--cc:vcc", "--verbosity:2"])
  libname = "clib"/"win"/"buckets.dll"
elif defined(macosx):
  osname = "mac"
  compiler = "cpp"
  build_flags.add(["--app:staticlib"])
  libname = "clib"/"mac"/"libbuckets.a"
else:
  osname = "linux"
  compiler = "cpp"
  build_flags.add(["--app:staticlib"])
  libname = "clib"/"linux"/"libbuckets.a"

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
  let sources = @[libname, "binding.gyp", "jstonimbinding.cpp"]
  when defined(windows):
    if ("lib"/"ia32"/"bucketslib.node").needsRefresh(sources):
      direShell "node-gyp", "clean", "configure", "rebuild", "--arch=ia32", "--verbose"
    if ("lib"/"x64"/"bucketslib.node").needsRefresh(sources):
      direShell "node-gyp", "clean", "configure", "rebuild", "--arch=x64", "--verbose"
  else:
    if ("lib"/"bucketslib.node").needsRefresh(sources):
      direShell "node-gyp", "clean", "configure", "rebuild", "--verbose"
  
  

task "staticlib", "Build the static lib":
  let nim_src = toSeq(walkDirRec(".."/"ccore"/"src")).filterIt(it.endsWith(".nim"))

  case mode
  of Release:
    echo "========= RELEASE build"
    build_flags.add("-d:release")
  of Debug:
    echo "========= DEBUG build"
    build_flags.add(@["--checks:on", "-d:useSysAssert", "-d:useGcAssert"])
  
  if libname.needsRefresh(nim_src):
    var args = @[nimExe, compiler, "-o:"&libname]
    args.add(build_flags)
    when defined(windows):
      # 64bit
      var args64 = args
      args64.add("--cpu:amd64")
      args64.add("--nimcache:csrc64")
      args64.add(".."/"ccore"/"src"/"buckets"/"clib.nim")
      echo "64 bit args: ", args64
      direShell args64
      var args32 = args
      args32.add("--cpu:i386")
      args32.add("--nimcache:csrc32")
      args32.add(".."/"ccore"/"src"/"buckets"/"clib.nim")
      echo "32 bit args: ", args32
      direShell args32
    else:
      args.add("--nimcache:csrc")
      args.add(".."/"ccore"/"src"/"buckets"/"clib.nim")
      direShell args
      let todelete = toSeq(walkDirRec("csrc")).filterIt(it.endsWith(".o") or it.endsWith(".cpp") or it.endsWith(".c"))
      for filename in todelete:
        removeFile(filename)

task "js", "Build JS files":
  let
    ts_files = toSeq(walkDirRec("jssrc")).filterIt(it.endsWith(".ts"))
    js_files = ts_files.mapIt(it.replace(".ts", ".js").replace("jssrc"/"", "dist"/""))
  if js_files.olderThan(ts_files):
    direShell "tsc"
