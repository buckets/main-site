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

# const gitSetupExe = slurp("tmp/Git-2.20.1-64-bit.exe")
const nimInstaller = slurp("tmp/nim-0.19.2_x64.zip")
const nimSourceZip = slurp("tmp/nim-goodversion.zip")

proc run(args:seq[string], workingDir: string = ""): int =
  echo "run", args
  var p = startProcess(args[0],
    workingDir = workingDir,
    args = args[1..^1],
    options = { poStdErrToStdOut, poParentStreams, poUsePath })
  result = p.waitForExit
  close(p)

proc runYes(args:seq[string]) =
  var p = startProcess(args[0],
    args = args[1..^1],
    options = { poStdErrToStdOut, poUsePath })
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

proc runOutput(args:seq[string], workingDir: string = ""): TaintedString =
  echo "runOutput", args
  var p = startProcess(args[0],
    workingDir = workingDir,
    args = args[1..^1],
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

proc runNoOutput(args:seq[string], workingDir: string = ""): int =
  echo "runNoOutput", args
  var p = startProcess(args[0],
    workingDir = workingDir,
    args = args[1..^1],
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


proc doEverything() =
  # look at environment variables
  echo "---------------------------------"
  echo "Environment"
  for k,v in envPairs():
    echo k, "=", v
  
  echo "---------------------------------"
  echo "Choco"
  try:
    discard run(@["choco"])
  except:
    echo "No chocolately :("
    discard runNoOutput(@[
      "powershell.exe",
      "-NoProfile",
      "-InputFormat", "None",
      "-ExecutionPolicy", "Bypass",
      "-Command",
      "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))",
    ])
    echo "Installed chocolatey!"
    quit(0)
  
  echo "---------------------------------"
  echo "Git"
  try:
    discard run(@["git", "--version"])
  except:
    echo "Installing git..."
    discard runNoOutput(@["choco", "install", "git.install", "-yfd"])
    echo "Installed git!"
    quit(0)
  
  # echo "---------------------------------"
  # echo "MinGW"
  # try:
  #   discard run(@["mingw-w64", "--version"])
  # except:
  #   echo "Installing mingw-w64..."
  #   discard runNoOutput(@["choco", "install", "mingw", "-yfd"])
  #   echo "Installed mingw-w64!"
  #   quit(0)
  
  echo "---------------------------------"
  echo "Nim"
  try:
    let output = runOutput(@["nim", "--version"])
    if "0.19.2" in output:
      raise newException(CatchableError, "Wrong version of nim installed")
  except:
    echo "Installing Nim..."
    createDir("C:\\niminstaller")
    writeFile("C:\\niminstaller\\installer.zip", nimInstaller)
    discard run(@["powershell.exe", "Expand-Archive C:\\niminstaller\\installer.zip C:\\niminstaller\\unzipped -Force"])
    runYes(@["c:\\niminstaller\\unzipped\\nim-0.19.2\\finish.exe"])
    writeFile("C:\\niminstaller\\nim.zip", nimSourceZip)
    discard run(@["powershell.exe", "Expand-Archive C:\\niminstaller\\nim.zip C:\\nim -Force"])

    discard run(@["git", "clone", "--depth", "1", "https://github.com/nim-lang/csources.git"], workingDir = "C:\\nim")
    discard run(@["call", "build64.bat"], workingDir = "C:\\nim\\csources")
    discard run(@["bin\\nim", "c", "koch"], workingDir = "C:\\nim")
    discard run(@["koch", "boot", "-d:release"], workingDir = "C:\\nim")
    discard run(@["koch", "tools"], workingDir = "C:\\nim")
    echo "Installed Nim!"
    quit(0)

  echo "THE CHICKEN IS IN THE POT"


if isMainModule:
  doEverything()

