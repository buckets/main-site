import nake
import sequtils

task "all", "Compile everything":
  echo "NOT IMPLEMENTED YET"
  quit(1)

task "clean", "Delete most intermediate files":
  withDir("nodebuckets"):
    shell "make", "clean"
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

task "nb-compile", "Generate nodebuckets/ library":
  withDir("nodebuckets"):
    direShell "make"

task "nb-test", "Run nodebuckets/ tests":
  runTask "nb-compile"
  withDir("nodebuckets"):
    direShell "make", "test"

#------------------------------------------------------------
# core/
#------------------------------------------------------------
const
  CORE_NB_LIB = "core"/"node_modules"/"bucketslib"/"lib"/"bucketslib.node"

task "core-compile", "Generate core/ library artifacts":
  runTask "nb-compile"
  if @[CORE_NB_LIB].needsRefresh(NB_LIB):
    withDir("core"):
      removeDir("node_modules/bucketslib")
      direShell "yarn", "add", "file:../nodebuckets"
    
  let
    core_ts_files = toSeq(walkDirRec("core"/"src")).filterIt(it.endsWith(".ts"))
    core_js_files = core_ts_files.mapIt(it.replace(".ts", ".js").replace("src"/"", "dist"/""))

  if core_js_files.needsRefresh(core_ts_files):
    withDir("core"):
      direShell "tsc"

task "core-test", "Run core/ tests":
  runTask "core-compile"
  withDir("core"):
    direShell "yarn", "test"

#------------------------------------------------------------
# app/
#------------------------------------------------------------