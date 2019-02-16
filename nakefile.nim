import nake
import times
import sequtils

proc needsRefresh(targets: seq[string], src: varargs[string]): bool {.raises: [OSError].} =
  ## Returns true if any ``src`` is newer than the oldest ``targets``.
  ##
  ## .. code-block:: nimrod
  ##   import nake, os
  ##
  ##   let
  ##     src = @["prog.nim", "prog2.nim"]
  ##     dst = @["prog.out", "prog_stats.txt"]
  ##   if dst.needsRefresh(src):
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

task "all", "Compile everything":
  runTask "app-js"

task "clean", "Delete most intermediate files":
  withDir("nodebuckets"):
    shell "nake", "clean"
  withDir("core"):
    removeDir("dist")
    removeDir("node_modules"/"bucketslib")
  withDir("app"):
    removeDir("node_modules"/"bucketslib")

task "deepclean", "Delete node_modules too":
  runTask("clean")
  withDir("core"):
    removeDir("node_modules")
    shell "yarn", "--ignore-scripts"
  withDir("app"):
    removeDir("node_modules")
    shell "yarn", "--ignore-scripts"
  withDir("nodebuckets"):
    removeDir("node_modules")

task "test", "Run all tests":
  runTask "ccore-test"
  runTask "nb-test"
  runTask "core-test"
  runTask "app-test"

#------------------------------------------------------------
# ccore/
#------------------------------------------------------------
task "ccore-test", "Run ccore tests":
  withDir("ccore"):
    direShell "nimble", "test"

#------------------------------------------------------------
# nodebuckets/
#------------------------------------------------------------
const
  NB_LIB = "nodebuckets"/"lib"/"bucketslib.node"
  NB_JS = toSeq(walkDirRec("nodebuckets"/"dist"))

task "nb-lib", "Generate nodebuckets/ library":
  # let
  #   ccore_nim_files = toSeq(walkDirRec("ccore"/"src")).filterIt(it.endsWith(".nim"))
  # if NB_LIB.needsRefresh(ccore_nim_files):
  withDir("nodebuckets"):
    direShell "nake"
  # let
  #   ts_files = toSeq(walkDirRec("nodebuckets"/"src")).filterIt(it.endsWith(".ts"))
  #   js_files = ts_files.mapIt(it.replace(".ts", ".js").replace("src"/"", "dist"/""))

task "nb-test", "Run nodebuckets/ tests":
  runTask "nb-lib"
  withDir("nodebuckets"):
    direShell "nake", "test"

#------------------------------------------------------------
# core/
#------------------------------------------------------------
const
  CORE_NB_LIB = "core"/"node_modules"/"bucketslib"/"lib"/"bucketslib.node"

task "core-lib", "Refresh core/ nodebuckets library":
  runTask "nb-lib"
  if CORE_NB_LIB.needsRefresh(NB_LIB) or CORE_NB_LIB.needsRefresh(NB_JS):
    withDir("core"):
      removeDir("node_modules/bucketslib")
      direShell "yarn", "add", "file:../nodebuckets"

task "core-js", "Generate core/ JS files":
  runTask "core-lib"
  let
    ts_files = toSeq(walkDirRec("core"/"src")).filterIt(it.endsWith(".ts"))
    js_files = ts_files.mapIt(it.replace(".ts", ".js").replace("src"/"", "dist"/""))

  if js_files.needsRefresh(ts_files):
    withDir("core"):
      direShell "tsc"

task "core-test", "Run core/ tests":
  runTask "core-js"
  withDir("core"):
    direShell "yarn", "test"

#------------------------------------------------------------
# app/
#------------------------------------------------------------
const
  APP_NB_LIB = "app"/"node_modules"/"bucketslib"/"lib"/"bucketslib.node"

task "app", "Build everything needed for app to run":
  runTask "app-js"

task "app-lib", "Refresh app/ nodebuckets library":
  runTask "core-js"
  if APP_NB_LIB.needsRefresh(CORE_NB_LIB):
    withDir("app"):
      removeDir("node_modules"/"bucketslib")
      direShell "yarn", "add", "file:../core"

task "app-js", "Generate app/ JS files":
  runTask "app-lib"
  let
    ts_files = toSeq(walkDirRec("app"/"src")).filterIt(it.endsWith(".ts") or it.endsWith(".tsx"))
    js_files = ts_files.mapIt(it.replace(".tsx", ".js").replace(".ts", ".js"))

  if js_files.needsRefresh(ts_files):
    withDir("app"):
      direShell "tsc"

task "app-test", "Run app/ tests":
  runTask "app-js"
  
  withDir("app"):
    direShell "yarn", "test"
