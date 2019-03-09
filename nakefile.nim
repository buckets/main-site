import nake
import times
import sequtils
import strformat

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

when defined(macosx):
  task "test-windows", "Run all tests on Windows":
    withDir("app"/"dev"/"win"):
      direShell "nake", "test"
  task "test-linux", "Run all tests on Linux":
    withDir(PROJECT_ROOT/"app"):
      direShell "dev"/"linux"/"linux_build.sh", "test"
  task "test-all", "Run all tests on all operating systems":
    runTask "test-windows"
    runTask "test-linux"
    runTask "test"


#------------------------------------------------------------
# ccore/
#------------------------------------------------------------
task "ccore-test", "Run ccore tests":
  withDir("ccore"):
    direShell "nimble", "test"

#------------------------------------------------------------
# nodebuckets/
#------------------------------------------------------------
when defined(windows):
  const NB_LIBS = @[
    "nodebuckets"/"lib"/"ia32"/"bucketslib.node",
    "nodebuckets"/"lib"/"x64"/"bucketslib.node",
  ]
else:
  const NB_LIBS = @[
    "nodebuckets"/"lib"/"x64"/"bucketslib.node",
  ]
const NB_JS = toSeq(walkDirRec("nodebuckets"/"dist"))

task "nb-lib", "Generate nodebuckets/ library":
  withDir("nodebuckets"):
    direShell "nake"

task "nb-test", "Run nodebuckets/ tests":
  runTask "nb-lib"
  withDir("nodebuckets"):
    direShell "nake", "test"

#------------------------------------------------------------
# core/
#------------------------------------------------------------
const
  CORE_NB_LIB = "core"/"node_modules"/"bucketslib"/"lib"/"x64"/"bucketslib.node"

task "core-lib", "Refresh core/ nodebuckets library":
  runTask "nb-lib"
  var nb_products:seq[string]
  nb_products.add(NB_LIBS)
  nb_products.add(NB_JS)
  if CORE_NB_LIB.needsRefresh(nb_products):
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
  APP_NB_LIB = "app"/"node_modules"/"bucketslib"/"lib"/"x64"/"bucketslib.node"

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
  if BUILD_BETA: "BucketsBeta" else: "Buckets"

template productName():string =
  if BUILD_BETA: "Buckets Beta" else: "Buckets"

template withPackageName(body:untyped):untyped =
  let old_file = readFile(PROJECT_ROOT/"app"/"package.json")
  try:
    let old_lines = old_file.splitLines()
    var
      new_lines:seq[string]
    for line in old_lines:
      # we'll assume the name comes first
      if line.startsWith("  \"name\":"):
        echo &"Setting package.json name to '{appName()}'"
        new_lines.add(line.replace("\"Buckets\"", &"\"{appName()}\""))
      elif line.startsWith("  \"productName\":"):
        echo &"Setting package.json productName to '{productName()}'"
        new_lines.add(line.replace("\"Buckets\"", &"\"{productName()}\""))
      else:
        new_lines.add(line)
    
    writeFile(PROJECT_ROOT/"app"/"package.json", new_lines.join("\L"))
    body
  finally:
    echo "Restoring package.json name,productName"
    writeFile(PROJECT_ROOT/"app"/"package.json", old_file)

proc currentDesktopVersion():string =
  for line in readFile("app"/"package.json").splitLines():
    if "version" in line:
      result = line.split("\"")[3]
      break

template assertGitHubToken():untyped =
  assert(getEnv("GH_TOKEN", "") != "", "You must set the GH_TOKEN environment variable.")


task "build-desktop", "Build Buckets for the current OS":
  runTask "desktop-js"
  withPackageName:
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
  withPackageName:
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
  task "build-desktop-linux", "Build Linux Buckets":
    withDir(PROJECT_ROOT/"app"):
      let cmd = if BUILD_BETA: "build-desktop-beta" else: "build-desktop"
      direShell "dev"/"linux"/"linux_build.sh", cmd
  task "build-desktop-linux-beta", "Build Linux Buckets Beta":
    doBeta()
    runTask "build-desktop-linux"
  task "publish-desktop-linux", "Publish Linux Buckets":
    withDir(PROJECT_ROOT/"app"):
      let cmd = if BUILD_BETA: "publish-desktop-beta" else: "publish-desktop"
      direShell "dev"/"linux"/"linux_build.sh", cmd
  task "publish-desktop-linux-beta", "Publish Linux Buckets Beta":
    doBeta()
    runTask "publish-desktop-linux"

when defined(macosx):
  task "build-desktop-windows", "Build Windows Buckets":
    assert existsEnv("WIN_CSC_LINK"), "Define WIN_CSC_LINK"
    assert existsEnv("WIN_CSC_KEY_PASSWORD"), "Define WIN_CSC_KEY_PASSWORD"
    withDir(PROJECT_ROOT/"app"/"dev"/"win"):
      let cmd = if BUILD_BETA: "build-beta" else: "build"
      direShell "nake", cmd
  task "build-desktop-windows-beta", "Build Windows Buckets Beta":
    doBeta()
    runTask "build-desktop-windows"

  task "publish-desktop-windows", "Publish Windows Buckets":
    assertGitHubToken()
    assert existsEnv("WIN_CSC_LINK"), "Define WIN_CSC_LINK"
    assert existsEnv("WIN_CSC_KEY_PASSWORD"), "Define WIN_CSC_KEY_PASSWORD"
    withDir(PROJECT_ROOT/"app"/"dev"/"win"):
      let cmd = if BUILD_BETA: "publish-beta" else: "publish"
      direShell "nake", cmd
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
    