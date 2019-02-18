import strutils
import os
import nake

type
  BuildType = enum
    Build,
    Publish,

template loggedDireShell(args:varargs[string, `$`]):untyped =
  echo "Running: ", args
  direShell(args)

template section(x:string):untyped =
  echo "--------------------------------------------------"
  echo x
  echo "--------------------------------------------------"

proc do_build(btype:BuildType) =
  echo "Starting build of type: ", btype

  section "Copying files into place ..."
  createDir("C:"/"proj"/"app"/"dist")
  removeDir("C:"/"proj"/"core"/"src")
  removeDir("C:"/"proj"/"core"/"migrations")
  removeDir("C:"/"proj"/"app"/"src")
  direShell "xcopy", "y:"/"", "c:"/"proj", "/f", "/I", "/s", "/Y", "/EXCLUDE:" & "Y:"/"app"/"dev"/"win"/"copyexclude.txt"

  section "node-gyp"
  loggedDireShell "npm", "config", "set", "msvs_version", "2015", "--global"
  loggedDireShell "npm", "install", "-g", "node-gyp"
  loggedDireShell "yarn", "global", "add", "node-gyp"

  section "yarn mirror"
  loggedDireShell "yarn", "config", "set", "yarn-offline-mirror", "y:"/"cache"/"yarnmirror"
  loggedDireShell "yarn", "config", "set", "yarn-offline-mirror-pruning", "false"
  loggedDireShell "yarn", "config", "list"

  section "nake"
  loggedDireShell "nimble", "install", "-y", "nake"

  section "compile everything"
  withDir("C:"/"proj"):
    loggedDireShell "nake", "deepclean"
    loggedDireShell "nake", "app"
  echo "done doing build"



if isMainModule:
  var btype = Build
  if paramCount() >= 2:
    btype = parseEnum[BuildType](paramStr(1), Build)
  do_build(btype)
