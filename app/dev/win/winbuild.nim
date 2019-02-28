import strutils
import os
import nakelib

const share = r"\\vboxsrv\project"

type
  BuildType = enum
    Build,
    BuildBeta,
    CleanBuild,
    DeepCleanBuild,
    Publish,
    PublishBeta,

template loggedDireShell(args:varargs[string, `$`]):untyped =
  echo "Running: ", args
  direShell(args)

template section(x:string):untyped =
  echo "--------------------------------------------------"
  echo "  " & x
  echo "--------------------------------------------------"

proc do_build(btype:BuildType) =
  echo "Starting build of type: ", btype

  section "Copying files into place ..."
  createDir("C:"/"proj"/"app"/"dist")
  removeDir("C:"/"proj"/"core"/"src")
  removeDir("C:"/"proj"/"core"/"migrations")
  removeDir("C:"/"proj"/"app"/"src")
  createDir("C:"/"tmp")
  echo "share: ", share
  let copyexcludefile = r"\"&share/"app"/"dev"/"win"/"copyexclude.txt"
  direShell "xcopy", share&"\\", "c:"/"proj", "/f", "/I", "/s", "/Y", "/EXCLUDE:"&copyexcludefile

  # section "node-gyp"
  loggedDireShell "npm", "config", "set", "msvs_version", "2015", "--global"
  loggedDireShell "yarn", "config", "set", "msvs_version", "2015", "--global"
  loggedDireShell "npm", "config", "set", "msvs_version", "2015"
  loggedDireShell "yarn", "config", "set", "msvs_version", "2015"
  # echo "Env"
  # loggedDireShell "set"
  # loggedDireShell "npm", "install", "-g", "node-gyp"
  # loggedDireShell "yarn", "global", "add", "node-gyp"

  section "yarn mirror"
  loggedDireShell "yarn", "config", "set", "yarn-offline-mirror", r"\"&share/"cache"/"yarnmirror"
  loggedDireShell "yarn", "config", "set", "yarn-offline-mirror-pruning", "false"
  loggedDireShell "npm", "config", "list"
  loggedDireShell "yarn", "config", "list"

  # section "nake"
  # loggedDireShell "nimble", "install", "-y", "nake"

  section "env"
  loggedDireShell "set"
  echo "path: "
  echo getEnv("Path").split(";").join("\L")

  section "compile everything"
  withDir("C:"/"proj"):
    if btype in {DeepCleanBuild, Publish, PublishBeta}:
      loggedDireShell "nake", "deepclean"
    elif btype in {CleanBuild}:
      loggedDireShell "nake", "clean"
    case btype
    of DeepCleanBuild, CleanBuild, Build:
      loggedDireShell "nake", "build-desktop"
    of BuildBeta:
      loggedDireShell "nake", "build-desktop-beta"
    of Publish:
      loggedDireShell "nake", "publish-desktop"
    of PublishBeta:
      loggedDireShell "nake", "publish-desktop-beta"
  echo "done doing build"



if isMainModule:
  var btype = Build
  if paramCount() >= 1:
    btype = parseEnum[BuildType](paramStr(1), Build)
  do_build(btype)
