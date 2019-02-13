import nake
import sequtils

type
  BuildMode = enum
    Release,
    Debug,
var
  mode:BuildMode = Release

var
  build_flags:seq[string] = @["--app:staticlib", "--header", "--nimcache:csrc", "--gc:markAndSweep"]
  compiler:string
  osname:string
  libname:string

when defined(windows):
  osname = "win"
  compiler = "c"
  build_flags.add(@["-d:mingw", "--cpu:amd64"])
  libname = "clib"/"win"/"buckets.lib"
elif defined(macosx):
  osname = "mac"
  compiler = "cpp"
  libname = "clib"/"mac"/"libbuckets.a"
else:
  osname = "linux"
  compiler = "cpp"
  libname = "clib"/"linux"/"libbuckets.a"

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
  let target = "lib"/"bucketslib.node"
  if target.needsRefresh(@[libname, "binding.gyp", "jstonimbinding.cpp"]):
    direShell "node-gyp", "rebuild"

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
    args.add(".."/"ccore"/"src"/"buckets"/"clib.nim")
    direShell args
    let todelete = toSeq(walkDirRec("csrc")).filterIt(it.endsWith(".o") or it.endsWith(".cpp") or it.endsWith(".c"))
    for filename in todelete:
      removeFile(filename)

task "js", "Build JS files":
  let
    ts_files = toSeq(walkDirRec("jssrc")).filterIt(it.endsWith(".ts"))
    js_files = ts_files.mapIt(it.replace(".ts", ".js").replace("jssrc"/"", "dist"/""))
  if js_files.needsRefresh(ts_files):
    direShell "tsc"
