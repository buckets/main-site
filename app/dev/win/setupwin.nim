## This script is meant to be run repeatedly until you see the string
##  THE CHICKEN IS IN THE POT
## Because several steps update that PATH and I can't figure out
## in Windows how to do the equivalent of `source .bashrc`
##
import sequtils
import strformat
import strutils
import osproc
import os
import streams
import strtabs

template withDir(dir:string, body:untyped):untyped =
  var firstDir = getCurrentDir()
  setCurrentDir(dir)
  body
  setCurrentDir(firstDir)

var penv:StringTableRef = nil

# const gitSetupExe = slurp("tmp/Git-2.20.1-64-bit.exe")
const nimInstaller = slurp("tmp/nim-0.19.2_x32.zip")
const mingwZip = slurp("tmp/mingw32-6.3.0.7z")
# const nimSourceZip = slurp("tmp/nim-goodversion.zip")

proc run(args:seq[string]): int =
  echo "> ", args.join(" ")
  var p = startProcess(args[0],
    args = args[1..^1],
    env = penv,
    options = { poStdErrToStdOut, poParentStreams, poUsePath })
  result = p.waitForExit
  close(p)

proc runYes(args:seq[string]) =
  echo "yes > ", args.join(" ")
  var p = startProcess(args[0],
    args = args[1..^1],
    options = { poStdErrToStdOut, poUsePath, poEvalCommand })
  var outp = outputStream(p)
  var inp = inputStream(p)
  inp.write("y\r\Ly\r\Ly\r\Ly\r\Ly\r\Ly\r\L")
  var line = newStringOfCap(200).TaintedString
  while true:
    if outp.readLine(line):
      echo line
    else:
      if peekExitCode(p) != -1:
        break
  close(p)

proc runOutput(args:seq[string]): TaintedString =
  echo "capture > ", args.join(" ")
  var p = startProcess(args[0],
    args = args[1..^1],
    env = penv,
    options = { poStdErrToStdOut, poUsePath })
  var outp = outputStream(p)
  result = TaintedString""
  var line = newStringOfCap(200).TaintedString
  while true:
    if outp.readLine(line):
      result.string.add(line.string)
      result.string.add("\n")
    else:
      if peekExitCode(p) != -1:
        break
  close(p)

proc runNoOutput(args:seq[string]): int =
  echo "silent > ", args.join(" ")
  var p = startProcess(args[0],
    args = args[1..^1],
    env = penv,
    options = { poStdErrToStdOut })
  var outp = outputStream(p)
  var line = newStringOfCap(120).TaintedString
  while true:
    if outp.readLine(line):
      discard
    else:
      result = peekExitCode(p)
      if result != -1: break
  close(p)

# proc refreshPath() =
#   # https://superuser.com/questions/390833/how-can-i-refresh-my-path-variable-from-the-registry-without-a-reboot-logoff
#   # echo "\LSTART PATH:"
#   # discard run(@["cmd", "/c", "echo", "%PATH%"])
#   let syspath = runOutput(@["reg", "query", "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment", "/v", "Path"])
#   let userpath = runOutput(@["reg", "query", "HKCU\\Environment", "/v", "Path"])
#   # echo syspath.repr
#   # echo userpath.repr
#   let syspath_part = syspath.split("    ")[^1].strip()
#   let userpath_part = userpath.split("    ")[^1].strip()
#   # echo "parts: ", parts.repr
#   let full_path = userpath_part & ";" & syspath_part
#   # echo "full path: ", full_path
#   echo "new Path: ", full_path
#   penv["Path"] = full_path
#   # discard run(@["cmd", "/c", "setx", "PATH", full_path])
#   # echo "\LEND PATH:"
#   # discard runNoOutput(@["cmd", "/c", "echo", "%PATH%"])

proc ensure_choco() =
  try:
    let output = runOutput(@["choco"])
    echo output
    if not("for help menu" in output):
      raise newException(CatchableError, "choco is not installed")
  except:
    echo "Installing chocolatey..."
    discard runNoOutput(@[
      "powershell.exe",
      "-NoProfile",
      "-InputFormat", "None",
      "-ExecutionPolicy", "Bypass",
      "-Command",
      "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))",
    ])
    echo "Installed chocolatey!"

proc display_env() =
  penv = newStringTable()
  for k,v in envPairs():
    penv[k] = v
    echo k, "=", v

proc ensure_7zip() =
  try:
    let output = runOutput(@["7z"])
    if not("Copyright" in output):
      raise newException(CatchableError, "7zip not installed")
  except:
    echo "Installing 7zip..."
    discard runNoOutput(@["choco", "install", "7zip", "-yfd"])
    echo "Installed 7zip!"
  
proc ensure_git() =
  try:
    if run(@["git", "--version"]) != 0:
      raise newException(CatchableError, "git not installed")
  except:
    echo "Installing git..."
    discard runNoOutput(@["choco", "install", "git.install", "-yfd"])
    echo "Installed git!"

proc ensure_gcc() =
  try:
    let output = runOutput(@["gcc", "--version"])
    echo output
    if not("Copyright" in output):
      raise newException(CatchableError, "gcc not present")
  except:
    echo "Installing gcc ..."
    if dirExists("C:\\mingw"):
      removeDir("C:\\mingw")
    createDir("C:\\mingw")
    withDir("C:\\mingw"):
      writeFile("mingw.7z", mingwZip)
      discard runNoOutput(@[
        "7z", "e", "-y", "mingw.7z"
      ])
      discard run(@["setx", "path", "%path%;C:\\mingw"])
      # discard run(@["dir"])
    # discard runNoOutput(@["choco", "install", "mingw", "-yfd"])
    echo "Installed gcc!"

proc ensure_prenim() =
  try:
    let output = runOutput(@["nim", "--version"])
    echo output
  except:
    createDir("C:\\niminstaller")
    withDir("C:\\niminstaller"):
      writeFile("nim.zip", nimInstaller)
      if dirExists("unzipped"):
        removeDir("unzipped")
      discard run(@[
        "powershell",
        "Expand-Archive",
        "nim.zip",
        "unzipped",
      ])
    withDir("C:\\niminstaller\\unzipped\\nim-0.19.2"):
      runYes(@["finish.exe"])
    echo "Installed bootstrap Nim!"

proc ensure_nim() =
  try:
    let output = runOutput(@["nim", "--version"])
    echo output
    if not("a58f5b6023744da9f44e6ab8b1c748002b2bbcc0" in output):
      raise newException(CatchableError, "Wrong version of nim installed")
  except:
    if dirExists("C:\\nim"):
      removeDir("C:\\nim")
    discard run(@["git", "clone", "https://github.com/nim-lang/Nim.git", "C:\\nim"])
    withDir("C:\\nim"):
      discard run(@["git", "checkout", "a58f5b6023744da9f44e6ab8b1c748002b2bbcc0"])
      discard run(@["git", "clone", "--depth", "1", "https://github.com/nim-lang/csources.git"])
    
      withDir("C:\\nim\\csources"):
        discard runNoOutput(@["build64.bat"])
      discard runNoOutput(@["bin\\nim", "c", "koch"])
      discard runNoOutput(@["koch", "boot", "-d:release"])
      discard runNoOutput(@["koch", "tools"])
    discard run(@["setx", "path", "%path%;C:\\nim\\bin;%userprofile%\\.nimble\\bin"])
    echo "Installed Nim!"

if isMainModule:
  case paramStr(1)
  of "env":
    display_env()
  of "choco":
    ensure_choco()
  of "7zip":
    ensure_7zip()
  of "git":
    ensure_git()
  of "gcc":
    ensure_gcc()
  of "prenim":
    ensure_prenim()
  of "nim":
    ensure_nim()
  else:
    echo "Unknown command.", paramStr(1)
    echo "Use one of the following:"
    echo "choco 7zip git gcc prenim nim"

