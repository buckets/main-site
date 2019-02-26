import nake
import times
import sequtils
import strformat

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

let PROJECT_ROOT = currentSourcePath().parentDir()

task "all", "Compile everything":
  runTask "desktop-js"

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
  runTask "desktop-test"

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

  if js_files.olderThan(ts_files):
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

task "desktop-lib", "Refresh app/ nodebuckets library":
  runTask "core-js"
  if APP_NB_LIB.needsRefresh(CORE_NB_LIB):
    withDir("app"):
      removeDir("node_modules"/"bucketslib")
      direShell "yarn", "add", "file:../core"

task "desktop-js", "Generate app/ JS files":
  runTask "desktop-lib"
  let
    ts_files = toSeq(walkDirRec("app"/"src")).filterIt(it.endsWith(".ts") or it.endsWith(".tsx"))
    js_files = ts_files.mapIt(it.replace(".tsx", ".js").replace(".ts", ".js"))

  if js_files.olderThan(ts_files):
    withDir("app"):
      direShell "tsc"

task "desktop-test", "Run app/ tests":
  runTask "desktop-js"
  
  withDir("app"):
    direShell "yarn", "test"


#-------------------------------------------------------
# desktop building
#-------------------------------------------------------
var
  BUILD_BETA = false

template doBeta() =
  BUILD_BETA = true

template electronConfigFile():string =
  if BUILD_BETA: "config_beta.js" else: "config_common.js"

template appName():string =
  if BUILD_BETA: "Buckets Beta" else: "Buckets"

proc currentDesktopVersion():string =
  for line in readFile("app"/"package.json").splitLines():
    if "version" in line:
      result = line.split("\"")[3]
      break

template assertGitHubToken():untyped =
  assert(getEnv("GH_TOKEN", "") != "", "You must set the GH_TOKEN environment variable.")


task "build-desktop", "Build Buckets for the current OS":
  runTask "desktop-js"
  withDir(PROJECT_ROOT/"app"):
    when defined(windows):
      direShell "build", "--config", electronConfigFile, "--win", "--x64", "--ia32"
    elif defined(macosx):
      direShell "build", "--config", electronConfigFile, "--mac"
    else:
      direShell "build", "--config", electronConfigFile, "--linux"

task "build-desktop-beta", "Build Buckets Beta for the current OS":
  doBeta()
  runTask "build-desktop"


#-------------------------------------------------------
# desktop publishing
#-------------------------------------------------------
task "publish-desktop", "Publish Buckets for the current OS":
  assertGitHubToken()
  runTask "desktop-js"
  withDir(PROJECT_ROOT/"app"):
    when defined(windows):
      direShell "build", "--config", electronConfigFile, "--win", "--x64", "--ia32", "-p", "always"
    elif defined(macosx):
      direShell "build", "--config", electronConfigFile, "--mac", "-p", "always"
    else:
      direShell "build", "--config", electronConfigFile, "--linux", "-p", "always"

task "publish-desktop-beta", "Publish Buckets Beta for the current OS":
  doBeta()
  runTask "publish-desktop"

when defined(macosx):
  task "publish-desktop-linux", "Publish Linux Buckets":
    withDir(PROJECT_ROOT/"app"):
      let cmd = if BUILD_BETA: "publish-beta" else: "publish"
      direShell "dev"/"linux"/"linux_build.sh", cmd

when defined(macosx):
  task "publish-desktop-linux-beta", "Publish Linux Buckets Beta":
    doBeta()
    runTask "publish-desktop-linux"

when defined(macosx):
  task "publish-desktop-windows", "Publish Windows Buckets":
    assertGitHubToken()
    assert existsEnv("CSC_LINK"), "Define CSC_LINK"
    assert existsEnv("CSC_KEY_PASSWORD"), "Define CSC_KEY_PASSWORD"
    withDir(PROJECT_ROOT/"app"/"dev"/"win"):
      let cmd = if BUILD_BETA: "publish-beta" else: "publish"
      direShell "nake", cmd

when defined(macosx):
  task "publish-desktop-windows-beta", "Publish Windows Buckets Beta":
    doBeta()
    runTask "publish-desktop-windows"

when defined(macosx):
  task "publish-desktop-all", "Publish Buckets (all operating systems)":
    runTask "publish-desktop"
    runTask "publish-desktop-linux"
    runTask "publish-desktop-windows"

when defined(macosx):
  task "publish-desktop-beta-all", "Publish Buckets Beta (all operating systems)":
    doBeta()
    runTask "publish-desktop-all"
    