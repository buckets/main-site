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
# const nimInstaller = slurp("tmp/nim-0.19.2_x32.zip")
const mingwZip = slurp("tmp/mingw32.zip")
const gitExe = slurp("tmp/Git32.exe")
const dllZip = slurp("tmp/dlls.zip")
# const nimSourceZip = slurp("tmp/nim-goodversion.zip")

const HKLM_ENV = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment"
# const HKCU_ENV = r"Environment"

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

proc run(args:seq[string], dftEnv:bool = false): int =
  echo "> ", args.join(" ")
  refreshPath()
  var p = startProcess(args[0],
    args = args[1..^1],
    env = if dftEnv: nil else: penv,
    options = { poStdErrToStdOut, poParentStreams, poUsePath })
  result = p.waitForExit
  close(p)

proc runYes(args:seq[string]) =
  echo "yes > ", args.join(" ")
  refreshPath()
  var p = startProcess(args[0],
    args = args[1..^1],
    env = penv,
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
  refreshPath()
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

proc display_env() =
  for k,v in envPairs():
    echo k, "=", v

# proc ensure_choco() =
#   try:
#     let output = runOutput(@["choco"])
#     echo output
#     if not("for help menu" in output):
#       raise newException(CatchableError, "choco is not installed")
#   except:
#     echo "Installing chocolatey..."
#     discard runNoOutput(@[
#       "powershell.exe",
#       "-NoProfile",
#       "-InputFormat", "None",
#       "-ExecutionPolicy", "Bypass",
#       "-Command",
#       "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))",
#     ])
#     echo "Installed chocolatey!"

# proc ensure_7zip() =
#   try:
#     let output = runOutput(@["7z"])
#     if not("Copyright" in output):
#       raise newException(CatchableError, "7zip not installed")
#   except:
#     echo "Installing 7zip..."
#     discard runNoOutput(@["choco", "install", "7zip", "-yfd"])
#     echo "Installed 7zip!"
  
# proc ensure_git() =
#   try:
#     if run(@["git", "--version"]) != 0:
#       raise newException(CatchableError, "git not installed")
#   except:
#     echo "Installing git..."
#     discard runNoOutput(@["choco", "install", "git.install", "-yfd"])
#     echo "Installed git!"

proc ensure_gitFromLocal() =
  try:
    if run(@["git", "--version"]) != 0:
      raise newException(CatchableError, "Git not installed")
  except:
    echo "Installing git..."
    createDir("C:"/"tmp")
    withDir("C:"/"tmp"):
      writeFile("Git32.exe", gitExe)
      discard run(@["Git32.exe", "/SILENT"])
      removeFile("Git32.exe")
    echo "Installed git!"

proc ensure_gcc() =
  try:
    let output = runOutput(@["gcc", "--version"])
    echo output
    if not("Copyright" in output):
      raise newException(CatchableError, "gcc not present")
  except:
    echo "Installing gcc ..."
    createDir("C:"/"tmp")
    writeFile("C:"/"tmp"/"mingw.zip", mingwZip)
    discard run(@[
      "powershell",
      "Expand-Archive",
      "C:"/"tmp"/"mingw.zip",
      "C:"/"mingw32",
    ])
    removeFile("C:"/"tmp"/"mingw.zip")
    addToPathEnv("C:"/"mingw32"/"mingw32"/"bin")
    echo "Installed gcc!"

proc ensure_nake() =
  try:
    let output = runOutput(@["nake", "--help"])
    echo output
    if not("No nakefile.nim found" in output):
      raise newException(CatchableError, "nake not present")
  except:
    echo "Installing nake ..."
    discard run(@["nimble", "install", "-y", "nake"])
    echo "Installed nake!"

# proc ensure_prenim() =
#   try:
#     let output = runOutput(@["gcc", "--version"])
#     echo output
#   except:
#     createDir("C:\\niminstaller")
#     withDir("C:\\niminstaller"):
#       writeFile("nim.zip", nimInstaller)
#       if dirExists("unzipped"):
#         removeDir("unzipped")
#       discard run(@[
#         "powershell",
#         "Expand-Archive",
#         "nim.zip",
#         "unzipped",
#       ])
#     if dirExists("C:"/"basenim"):
#       removeDir("C:"/"basenim")
#     moveDir("C:"/"niminstaller"/"unzipped"/"nim-0.19.2",
#             "C:"/"basenim")
#     withDir("C:"/"basenim"):
#       runYes(@["finish.exe"])
#     addToPathEnv("C:"/"basenim"/"dist"/"mingw32"/"bin")
#     # discard run(@["setx", "PATH", "%PATH%;C:\\basenim\\dist\\mingw32\\bin", "/m"])
#     echo "Installed bootstrap Nim!"

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
    addToPathEnv("C:"/"nim"/"bin")
    addToPathEnv(getEnv("USERPROFILE")/".nimble"/"bin")
    addToPathEnv("C:"/"Users"/"IEUser"/".nimble"/"bin")
    withDir("C:"/"nim"):
      discard run(@["git", "checkout", expected_sha])
      if not dirExists("csources"):
        discard run(@["git", "clone", "--depth", "1", "https://github.com/nim-lang/csources.git"])
      if not fileExists("bin"/"nim.exe"):
        withDir("C:"/"nim"/"csources"):
          discard run(@["build.bat"], dftEnv = true)
      discard run(@["bin"/"nim", "c", "koch"], dftEnv = true)
      discard run(@["koch.exe", "boot", "-d:release"], dftEnv = true)
      discard run(@["koch.exe", "tools"], dftEnv = true)
    # add more dlls
    withDir("C:"/"nim"/"bin"):
      writeFile("dlls.zip", dllZip)
      discard run(@[
        "powershell",
        "Expand-Archive",
        "dlls.zip",
        ".",
      ])
    # discard run(@["setx", "PATH", "%PATH%;C:\\nim\\bin;%USERPROFILE%\\.nimble\\bin", "/m"])
    echo "Installed Nim!"

if isMainModule:
  penv = newStringTable()
  for k,v in envPairs():
    penv[k] = v
  # echo "Initial Path: ", getEnv("Path")

  case paramStr(1)
  of "env":
    display_env()
  of "git":
    ensure_gitFromLocal()
  of "gcc":
    ensure_gcc()
  of "nim":
    ensure_nim()
  of "nake":
    ensure_nake()
  else:
    echo "Unknown command.", paramStr(1)

