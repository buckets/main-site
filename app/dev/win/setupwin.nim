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
const nodemsi = slurp("tmp/node.msi")
const yarnmsi = slurp("tmp/yarn.msi")
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

proc addToPathEnv*(e: string, regkey: HKEY) =
  echo "Adding to PATH: ", e
  if "is not recognized" in e:
    raise newException(CatchableError, "Trying to add a bad PATH: " & e)
  var key = if regkey == HKEY_LOCAL_MACHINE: HKLM_ENV else: HKCU_ENV
  var p = tryGetUnicodeValue(key, "Path", regkey)
  let x = if e.contains(Whitespace): "\"" & e & "\"" else: e
  if p.len > 0:
    p.add ";"
    p.add x
  else:
    p = x
  setUnicodeValue(key, "Path", p, regkey)

proc addToPathEnv*(e: string) =
  addToPathEnv(e, HKEY_LOCAL_MACHINE)
  # addToPathEnv(e, HKEY_CURRENT_USER)

proc refreshPath() =
  penv["Path"] = tryGetUnicodeValue(r"Environment", "Path", HKEY_CURRENT_USER) & ";" & tryGetUnicodeValue(r"Environment", "Path", HKEY_LOCAL_MACHINE)

proc run(args:seq[string], dftEnv:bool = false, stdintext:string = ""): int =
  echo "> ", args.join(" ")
  refreshPath()
  var opts = { poStdErrToStdOut, poUsePath }
  if stdintext == "":
    opts.incl(poParentStreams)
  var p = startProcess(args[0],
    args = args[1..^1],
    env = if dftEnv: nil else: penv,
    options = opts)
  if stdintext != "":
    var inp = inputStream(p)
    var outp = outputStream(p)
    inp.write(stdintext)
    var line = newStringOfCap(512).TaintedString
    while true:
      if outp.readLine(line):
        echo line
      else:
        break
  result = p.waitForExit
  close(p)

# proc runYes(args:seq[string]) =
#   echo "yes > ", args.join(" ")
#   refreshPath()
#   var p = startProcess(args[0],
#     args = args[1..^1],
#     env = penv,
#     options = { poStdErrToStdOut, poUsePath, poEvalCommand })
#   var outp = outputStream(p)
#   var inp = inputStream(p)
#   inp.write("y\r\Ly\r\Ly\r\Ly\r\Ly\r\Ly\r\L")
#   var line = newStringOfCap(200).TaintedString
#   while true:
#     if outp.readLine(line):
#       echo line
#     else:
#       if peekExitCode(p) != -1:
#         break
#   close(p)

proc runOutput(args:seq[string], dftEnv:bool = false): TaintedString =
  echo "capture > ", args.join(" ")
  refreshPath()
  var p = startProcess(args[0],
    args = args[1..^1],
    env = if dftEnv: nil else: penv,
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
    options = { poStdErrToStdOut, poUsePath })
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

proc ensure_psexec() =
  discard runNoOutput(@[
    "choco", "install", "psexec", "-yfd"
  ])

proc ensure_node() =
  try:
    if run(@["node", "--version"]) != 0:
      raise newException(CatchableError, "Node not installed")
  except:
    echo "Installing node..."
    createDir("C:"/"tmp")
    withDir("C:"/"tmp"):
      writeFile("node.msi", nodemsi)
      discard run(@["msiexec", "/qn", "/passive", "/i", "C:"/"tmp"/"node.msi"])
      removeFile("node.msi")
    echo "Installed node!"

proc ensure_yarn() =
  try:
    if run(@["yarn", "--version"]) != 0:
      raise newException(CatchableError, "Yarn not installed")
  except:
    echo "Installing Yarn..."
    createDir("C:"/"tmp")
    withDir("C:"/"tmp"):
      writeFile("yarn.msi", yarnmsi)
      discard run(@["msiexec", "/qn", "/passive", "/i", "C:"/"tmp"/"yarn.msi"])
      removeFile("yarn.msi")
    echo "Installed Yarn!"

proc ensure_buildtools() =
  echo "Installing buildtools ..."
  let
    npm = findExe("npm")
    yarn = findExe("yarn")
  
  createDir("C:"/"tmp")
  withDir("C:"/"tmp"):
    let installeropt = "--offline-installers=\"\\\\vboxsrv\\project\\app\\dev\\win\\tmp\""
    writeFile("installbuildtools.bat", @[
      "@echo on",
      # r"set APPDATA=C:\Users\IEUser\AppData\Roaming",
      # r"call npm config set prefix C:\Users\IEUser\AppData\Roaming\npm",
      # r"set USERNAME=IEUser",
      # r"set USERPROFILE=C:\Users\IEUser",
      # "echo USERNAME = %USERNAME%",
      # "echo USERPROFILE = %USERPROFILE%",
      # "echo APPDATA = %APPDATA%",
      &"call npm install --global --production windows-build-tools --vs2015 {installeropt}",
      # &"call yarn global add windows-build-tools --vs2015 {installeropt}",
      # r"md C:\Users\IEUser\.windows-build-tools",
      # r"xcopy C:\Users\Administrator\.windows-build-tools C:\Users\IEUser\.windows-build-tools /s /f",
      # r"call npm config set msvs_version 2015 --global",
      # r"call yarn config set msvs_version 2015 --global",
      ].join("\r\L"))
    discard run(@["psexec", "-h", "-u", "IEUser", "-p", "Passw0rd!", "C:"/"tmp"/"installbuildtools.bat"])
  # discard run(@["cmdkey", r"/add:MSEDGEWIN10", r"/user:MSEDGEWIN10\Administrator", "/pass:admin"])
  # discard run(@["cmdkey", r"/add:Domain:interactive=MSEDGEWIN10\Administrator", r"/user:MSEDGEWIN10\Administrator", "/pass:admin"])
  # discard run(@["cmdkey", "/list"])
  
  # echo "Running echo with runas"
  # discard run(@["runas", "/savecred", "/user:Administrator", "cmd /c \"echo hello\""])
  # discard run(@["cmdkey", "/list"])
  

  # Installing as a non admin https://www.npmjs.com/package/windows-build-tools#installing-as-a-non-administrator
  # penv["APPDATA"] = "C:"/"Users"/"IEUser"/"AppData"/"Roaming"
  # discard run(@[npm, "config", "set", "prefix", "C:"/"Users"/"IEUser"/"AppData"/"Roaming"/"npm"])
  # penv["USERNAME"] = "IEUser"
  # penv["USERPROFILE"] = "C:"/"Users"/"IEUser"
  # refreshPath()
  # echo "penv path: ", penv["Path"]
  # echo "Set penv to:"
  # echo $penv

  # discard run(@["runas", "/savecred", "/user:Administrator", "npm --vs2015 install --global --production windows-build-tools"], dftEnv = true)
  # discard run(@["runas", "/savecred", "/user:Administrator","yarn global add windows-build-tools --vs2015"], dftEnv = true)
  # discard run(@[npm, "config", "list"])
  # # discard run(@[findExe("mkdir"), "C:"/"Users"/"IEUser"/".windows-build-tools"], dftEnv = true)
  # # echo "USERPROFILE=", runOutput(@[findExe"echo", "%USERPROFILE%"])
  # # discard run(@[findExe("xcopy"), "C:"/"Users"/"Administrator"/".windows-build-tools", "C:"/"Users"/"IEUser"/".windows-build-tools", "/s", "/f"], dftEnv = true)
  # echo "Maybe installed buildtools?"

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
    discard run(@["nimble", "install", "-y", "nake"], dftEnv = true)
    echo "Installed nake!"

proc firstline(x:string):string = x.splitLines()[0]

proc ensure_nodegyp() =
  try:
    let output = runOutput(@["node-gyp", "--help"])
    echo output
    raise newException(CatchableError, "node-gyp not present")
  except:
    echo "Installing node-gyp ..."
    let
      npm = findExe("npm")
      yarn = findExe("yarn")
    discard run(@[npm, "config", "set", "msvs_version", "2015"], dftEnv = true)
    discard run(@[npm, "config", "set", "python", "C:"/"Users"/"IEUser"/".windows-build-tools"/"python27"/"python.exe"], dftEnv = true)
    discard run(@[npm, "install", "-g", "node-gyp"], dftEnv = true)
    discard run(@[yarn, "global", "add", "node-gyp"], dftEnv = true)
    let
      npm_global_bin = runOutput(@[npm, "bin", "--global"], dftEnv = true).firstline()
      npm_bin = runOutput(@[npm, "bin"], dftEnv = true).firstline()
      yarn_global_bin = runOutput(@[yarn, "global", "bin"], dftEnv = true).firstline()
      yarn_bin = runOutput(@[yarn, "bin"], dftEnv = true).firstline()
    echo "paths:"
    echo "npm g:", npm_global_bin
    echo "npm  :", npm_bin
    echo "yarng:", yarn_global_bin
    echo "yarn :", yarn_bin
    addToPathEnv(npm_global_bin)
    addToPathEnv(npm_bin)
    addToPathEnv(yarn_global_bin)
    addToPathEnv(yarn_bin)
    addToPathEnv("."/"node_modules"/".bin"/"")
    # addToPathEnv(r"C:\Program Files (x86)\Yarn\bin\")
    # addToPathEnv(r"C:\Users\IEUser\AppData\Roaming\npm")
    echo "Installed node-gyp!"

proc ensure_env() =
  discard run(@[findExe"npm", "config", "set", "msvs_version", "2015", "--global"], dftEnv = true)
  discard run(@[findExe"yarn", "config", "set", "msvs_version", "2015", "--global"], dftEnv = true)
  discard run(@[findExe"npm", "config", "set", "msvs_version", "2015"], dftEnv = true)
  discard run(@[findExe"yarn", "config", "set", "msvs_version", "2015"], dftEnv = true)
  discard run(@["setx", "PYTHON", "C:"/"Users"/"IEUser"/".windows-build-tools"/"python27"/"python.exe"])
  discard run(@["setx", "VCTargetsPath", "C:"/"Program Files (x86)"/"MSBuild"/"Microsoft.cpp"/"v4.0"/"v140"])
  discard run(@["setx", "ELECTRON_BUILDER_CACHE", "\\" & r"\vboxsrv\project"/"cache"/"electron-cache"])
  discard run(@["setx", "ELECTRON_CACHE", "\\" & r"\vboxsrv\project"/"cache"/"electron-cache"])
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
  echo "command: ", paramStr(1)

  try:
    case paramStr(1)
    of "choco":
      ensure_choco()
    of "psexec":
      ensure_psexec()
    of "git":
      ensure_gitFromLocal()
    of "gcc":
      ensure_gcc()
    of "nim":
      ensure_nim()
    of "nake":
      ensure_nake()
    of "node":
      ensure_node()
    of "yarn":
      ensure_yarn()
    of "node-gyp":
      ensure_nodegyp()
    of "buildtools":
      ensure_buildtools()
    of "env":
      ensure_env()
    else:
      echo "Unknown command.", paramStr(1)
  except:
    echo getCurrentExceptionMsg()
    sleep(10000)
    raise

