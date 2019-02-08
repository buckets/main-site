when not defined(windows):
  {.fatal: "Windows only".}

import sequtils
import strformat
import strutils
import osproc
import os
import streams
import strtabs
import windows/registry

const expected_sha = "a58f5b6023744da9f44e6ab8b1c748002b2bbcc0"
# const gitSetupExe = slurp("tmp/Git-2.20.1-64-bit.exe")
const nimInstaller = slurp("tmp/nim-0.19.2_x32.zip")
# const mingwZip = slurp("tmp/mingw32-6.3.0.7z")
# const nimSourceZip = slurp("tmp/nim-goodversion.zip")

const HKLM_ENV = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment"
const HKCU_ENV = r"Environment"

var penv: StringTableRef

template withDir(dir:string, body:untyped):untyped =
  var firstDir = getCurrentDir()
  setCurrentDir(dir)
  body
  setCurrentDir(firstDir)

# from Nim/tools/finish.nim
proc tryGetUnicodeValue(path, key: string; handle: HKEY): string =
  try:
    result = getUnicodeValue(path, key, handle)
  except:
    result = ""

proc addToPathEnv*(e: string) =
  echo "Adding to PATH: ", e
  var p = tryGetUnicodeValue(HKLM_ENV, "Path", HKEY_LOCAL_MACHINE)
  let x = if e.contains(Whitespace): "\"" & e & "\"" else: e
  if p.len > 0:
    p.add ";"
    p.add x
  else:
    p = x
  setUnicodeValue(HKLM_ENV, "Path", p, HKEY_LOCAL_MACHINE)

proc refreshPath() =
  penv["Path"] = tryGetUnicodeValue(r"Environment", "Path", HKEY_CURRENT_USER) & ";" & tryGetUnicodeValue(r"Environment", "Path", HKEY_LOCAL_MACHINE)
  # echo "Path = ", penv["Path"]

proc run(args:seq[string]): int =
  echo "> ", args.join(" ")
  refreshPath()
  var p = startProcess(args[0],
    args = args[1..^1],
    #env = penv,
    options = { poStdErrToStdOut, poParentStreams, poUsePath })
  result = p.waitForExit
  close(p)

proc runYes(args:seq[string]) =
  echo "yes > ", args.join(" ")
  refreshPath()
  var p = startProcess(args[0],
    args = args[1..^1],
    #env = penv,
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
  refreshPath()
  var p = startProcess(args[0],
    args = args[1..^1],
    #env = penv,
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
  refreshPath()
  var p = startProcess(args[0],
    args = args[1..^1],
    #env = penv,
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
  for k,v in envPairs():
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

# proc ensure_gcc() =
#   try:
#     let output = runOutput(@["gcc", "--version"])
#     echo output
#     if not("Copyright" in output):
#       raise newException(CatchableError, "gcc not present")
#   except:
#     echo "Installing gcc ..."
#     if dirExists("C:\\mingw"):
#       removeDir("C:\\mingw")
#     createDir("C:\\mingw")
#     withDir("C:\\mingw"):
#       writeFile("mingw.7z", mingwZip)
#       discard runNoOutput(@[
#         "7z", "e", "-y", "mingw.7z"
#       ])
#       addToPathEnv("C:"/"mingw")
#       discard run(@["setx", "path", "%path%;C:\\mingw"])
#       # discard run(@["dir"])
#     # discard runNoOutput(@["choco", "install", "mingw", "-yfd"])
#     echo "Installed gcc!"

proc ensure_prenim() =
  try:
    let output = runOutput(@["gcc", "--version"])
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
    if dirExists("C:"/"basenim"):
      removeDir("C:"/"basenim")
    moveDir("C:"/"niminstaller"/"unzipped"/"nim-0.19.2",
            "C:"/"basenim")
    withDir("C:"/"basenim"):
      runYes(@["finish.exe"])
    addToPathEnv("C:"/"basenim"/"dist"/"mingw32"/"bin")
    # discard run(@["setx", "PATH", "%PATH%;C:\\basenim\\dist\\mingw32\\bin", "/m"])
    echo "Installed bootstrap Nim!"

proc ensure_nim() =
  try:
    let output = runOutput(@["nim", "--version"])
    echo output
    if not(expected_sha in output):
      raise newException(CatchableError, "Wrong version of nim installed")
  except:
    if dirExists("C:"/"nim"):
      removeDir("C:"/"nim")
    discard run(@["git", "clone", "https://github.com/nim-lang/Nim.git", "C:"/"nim"])
    withDir("C:"/"nim"):
      discard run(@["git", "checkout", expected_sha])
      discard run(@["git", "clone", "--depth", "1", "https://github.com/nim-lang/csources.git"])
    
      withDir("C:"/"nim"/"csources"):
        discard run(@["build.bat"])
      discard runNoOutput(@["bin"/"nim", "c", "koch"])
      discard runNoOutput(@["koch", "boot", "-d:release"])
      discard runNoOutput(@["koch", "tools"])
    addToPathEnv("C:"/"nim"/"bin")
    addToPathEnv(getEnv("USERPROFILE")/".nimble"/"bin")
    # discard run(@["setx", "PATH", "%PATH%;C:\\nim\\bin;%USERPROFILE%\\.nimble\\bin", "/m"])
    echo "Installed Nim!"

if isMainModule:
  penv = newStringTable()
  for k,v in envPairs():
    penv[k] = v
  echo "Initial Path: ", getEnv("Path")

  case paramStr(1)
  of "env":
    display_env()
  of "choco":
    ensure_choco()
  of "7zip":
    ensure_7zip()
  of "git":
    ensure_git()
  # of "gcc":
  #   ensure_gcc()
  of "prenim":
    ensure_prenim()
  of "nim":
    ensure_nim()
  else:
    echo "Unknown command.", paramStr(1)
    echo "Use one of the following:"
    echo "choco 7zip git gcc prenim nim"

