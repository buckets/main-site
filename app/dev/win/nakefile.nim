import nake
import sequtils
import osproc
import re
import strutils
import strformat
import base64
import tables
import terminal

const
  YARN_MSI_URL = "https://yarnpkg.com/latest.msi"
  NODE_MSI_URL = "https://nodejs.org/dist/v11.8.0/node-v11.8.0-x64.msi"
  PYTHON_MSI_URL = "https://www.python.org/ftp/python/2.7.15/python-2.7.15.msi"
  VS_INSTALLER_URL = "https://download.microsoft.com/download/5/f/7/5f7acaeb-8363-451f-9425-68a90f98b238/visualcppbuildtools_full.exe"

#--------------------------------------------------------
# Variables
#--------------------------------------------------------
type
  VirtualMachine = string
  VmState = enum
    Unknown,
    PowerOff,
    Aborted,
    Running,
    Paused,
    Stuck,
    Saved,
    Starting,
    Restoring,
    Snapshotting,
    OnlineSnapshotting,
    Saving,
    Stopping,
  SharedFolder = ref object
    hostdir: string
    sharename: string


const
  OSTYPE = "win10"

let
  project_dir = getAppFilename().parentDir().parentDir().parentDir().parentDir()

var
  vm:VirtualMachine
  win_user = "IEUser"
  win_pass = "Passw0rd!"
  admin_user = "Administrator"
  admin_pass = "admin"

when OSTYPE == "win10":
  vm = "win10builder"

#--------------------------------------------------------
# Logging
#--------------------------------------------------------
var
  log_prefix:seq[string]

template withLogPrefix(x:string, body:untyped):untyped =
  log_prefix.add(x)
  try:
    body
  finally:
    discard log_prefix.pop()

template log(x:varargs[untyped]) =
  for i in log_prefix:
    stdout.write(i & " ")
  echo x

template withSigningCerts(body:untyped):untyped =
  try:
    let
      csc_link = getEnv("WIN_CSC_LINK", "")
      csc_key_password = getEnv("WIN_CSC_KEY_PASSWORD", "")
    if csc_link != "" and csc_key_password != "":
      log "Preparing code signing certificate ..."
      writeFile(project_dir/"csc_link.p12", csc_link.encode())
      writeFile(project_dir/"csc_key_password.txt", csc_key_password)
    body
  finally:
    log "Removing code signing certificate ..."
    removeFile(project_dir/"csc_link.p12")
    removeFile(project_dir/"csc_key_password.txt")

#--------------------------------------------------------
# output commands
#--------------------------------------------------------
proc getOutput(cmd: varargs[string, `$`]): string =
  execProcess(cmd[0], args = cmd[1..^1],
    options = {poStdErrToStdOut, poUsePath})

#--------------------------------------------------------
# helpers
#--------------------------------------------------------

proc gaCmdArgs(vm:VirtualMachine, env:Table[string,string], args:varargs[string, `$`]):seq[string] =
  result = @["vboxmanage", "guestcontrol", vm, "run",
  "--username", win_user, "--password", win_pass,
  "--unquoted-args"]
  for key,val in env.pairs():
    result.add(["--putenv", &"{key}={val}"])
  result.add(["--", "cmd.exe", "/c"])
  result.add(args)

proc gaCmdArgs(vm:VirtualMachine, args:varargs[string, `$`]):seq[string] =
  result = vm.gaCmdArgs(initTable[string,string](2), args = args)

proc gaCmd(vm:VirtualMachine, env:Table[string,string], args:varargs[string, `$`]) =
  ## Execute a guest additions command with environment variables
  ## Execute a guest additions command
  let all_args = vm.gaCmdArgs(env, args = args)
  echo "VM IEUser> " & args.join(" ")
  shell(all_args)

proc gaCmd(vm:VirtualMachine, args:varargs[string, `$`]) =
  vm.gaCmd(initTable[string,string](2), args = args)

proc gaDireCmd(vm:VirtualMachine, args:varargs[string, `$`]) =
  ## Execute a guest additions command
  let all_args = vm.gaCmdArgs(args)
  echo "VM IEUser> " & args.join(" ")
  direShell(all_args)

proc gaAdminCmdArgs(vm:VirtualMachine, args:varargs[string, `$`]):seq[string] =
  result = @["vboxmanage", "guestcontrol", vm, "run",
  "--username", admin_user, "--password", admin_pass,
  "--unquoted-args", "--", "cmd.exe", "/c"]
  result.add(args)

proc gaAdminCmd(vm:VirtualMachine, args:varargs[string, `$`]) =
  ## Execute a guest additions command
  let all_args = vm.gaAdminCmdArgs(args)
  echo "VM Admin> " & args.join(" ")
  direShell(all_args)

proc status_text(vm:VirtualMachine): string =
  getOutput("vboxmanage", "showvminfo", "--machinereadable", vm)

proc state(vm:VirtualMachine): VmState =
  let output = vm.status_text()
  if output =~ rex(""".*?^VMState="(.*?)"$.*?""", {reStudy, reDotAll, reMultiLine}):
    case matches[0]
    of "poweroff": result = PowerOff
    of "aborted": result = Aborted
    of "starting": result = Starting
    of "running": result = Running
    of "restoring": result = Restoring
    of "paused": result = Paused
    of "stuck": result = Stuck
    of "snapshotting": result = Snapshotting
    of "onlinesnapshotting": result = OnlineSnapshotting
    of "saving": result = Saving
    of "saved": result = Saved
    of "stopping": result = Stopping
    else:
      echo "UNKNOWN STATE:"
      echo output
      result = Unknown
  else:
    echo "UNKNOWN STATE (nomatch):"
    echo output

proc settled_state(vm:VirtualMachine):VmState =
  while true:
    let state = vm.state()
    case state
    of Starting,Restoring,Snapshotting,OnlineSnapshotting,Saving:
      discard
    else:
      return state
    sleep(1000)      

proc turn_on(vm:VirtualMachine, headless = true) =
  let state = vm.settled_state()
  case state
  of Aborted,PowerOff,Unknown,Paused,Saved:
    # turn it on
    log "Starting the VM..."
    if headless:
      direShell "vboxmanage", "startvm", vm, "--type", "headless"
    else:
      direShell "vboxmanage", "startvm", vm
    while vm.state() == Starting:
      sleep(100)
    let final_state = vm.settled_state()
    if final_state == Running:
      log vm, " is on"
      sleep(1000)
      return
    else:
      log "Unexpeected state: ", final_state
      quit(1)
  of Starting,Restoring,Snapshotting,OnlineSnapshotting,Saving,Stopping:
    log "Invalid state: ", state
    quit(1)
  of Running:
    # it's already on
    sleep(1000)
    discard
  of Stuck:
    log "VM is stuck"
    quit(1)

proc turn_off(vm:VirtualMachine) =
  var state = vm.settled_state()
  case state
  of Aborted,PowerOff,Unknown,Paused,Saved:
    sleep(1000)
    return
  of Starting,Restoring,Snapshotting,OnlineSnapshotting,Saving,Stopping:
    log "Invalid state: ", state
    quit(1)
  of Running:
    log "Turning the VM off..."
    for i in 0..120:
      state = vm.state()
      if state == Running:
        if i mod 30 == 0:
          log "Pressing the power button..."
          direShell "vboxmanage", "controlvm", vm, "acpipowerbutton"
        sleep(1000)
      elif state == Stopping:
        sleep(1000)
      else:
        log vm, " is off"
        sleep(1000)
        return
    while vm.state() == Running:
      sleep(1000)
  of Stuck:
    log "VM is stuck"
    quit(1)

proc ensure_booted(vm:VirtualMachine) =
  vm.turn_on()
  while true:
    let output = getOutput(vm.gaCmdArgs("echo", "hello"))
    if "hello" in output:
      break
    else:
      sleep(1000)
  log "booted"

proc ensure_signedin(vm:VirtualMachine, user:string) =
  vm.ensure_booted()
  while true:
    let output = getOutput(vm.gaCmdArgs("query", "user"))
    if user.toLowerAscii() in output:
      break
    else:
      sleep(1000)
  sleep(1000)
  log &"user {user} signed in"

proc `$`*(f:SharedFolder):string =
  result = &"hostdir:{f.hostdir} sharename:{f.sharename}"

proc shared_folders(vm:VirtualMachine):seq[SharedFolder] =
  let lines = vm.status_text().splitLines()
  for line in lines:
    if line.startsWith("SharedFolderNameMachineMapping"):
      var thing:SharedFolder
      new(thing)
      result.add(thing)
      thing.sharename = line.split("\"")[1]
    elif line.startsWith("SharedFolderPathMachineMapping"):
      result[result.len-1].hostdir = line.split("\"")[1]

proc ensure_shared_folder(vm:VirtualMachine, hostdir:string, sharename:string) =
  withLogPrefix("(sharedfolder)"):
    for folder in vm.shared_folders:
      if folder.hostdir == hostdir and folder.sharename == sharename:
        return
    let state = vm.settled_state()
    let was_on = state == Running
    if not(state in {Aborted,PowerOff,Unknown,Paused,Saved}):
      vm.turn_off()
    log "state: ", vm.settled_state()

    # you have to turn it off and on again
    shell "vboxmanage", "sharedfolder", "add", vm, "--name", sharename, "--hostpath", hostdir, "--automount"
    # vm.ensure_booted()
    # vm.turn_off()
    # if was_on:
    #   vm.turn_on()
    log "Added shared folder ", hostdir, " -> ", sharename

proc ensure_mount(vm:VirtualMachine, hostdir:string, sharename:string) =
  withLogPrefix(&"(mount {sharename})"):
    vm.ensure_shared_folder(hostdir, sharename)
    vm.ensure_signedin(win_user)
    let expected = r"\\vboxsrv\" & sharename
    log &"Waiting for share '{sharename}' ..."
    for i in 0..30:
      let output = getOutput(vm.gaCmdArgs("net", "use"))
      if expected in output:
        log &"share '{sharename}' is available: {expected}"
        let output = getOutput(vm.gaCmdArgs("dir", expected))
        if "Directory of" in output:
          return
      sleep(1000)
    raise newException(CatchableError, "Timed out getting share")

proc ensure_unmounted(vm:VirtualMachine, drive:string) =
  vm.ensure_signedin(win_user)
  withLogPrefix(&"(unmount {drive}:)"):
    let expected = drive.toLowerAscii & ":"
    for i in 0..10:
      let output = getOutput(vm.gaCmdArgs("net", "use"))
      echo output
      if expected in output.toLowerAscii():
        log &"Attempting to unmount {expected}"
        vm.gaCmd("net", "use", expected, "/delete")
      else:
        return
    raise newException(CatchableError, "Error unmounting")

proc snapshots(vm:VirtualMachine):seq[string] =
  ## List the snapshots a VM has
  let lines = vm.status_text().splitLines()
  for line in lines:
    if line.startsWith("SnapshotName"):
      result.add(line.split("\"")[1])

proc take_snapshot(vm:VirtualMachine, name:string) =
  ## Create a snapshot from the current machine
  log "Preparing to take snapshot..."
  vm.turn_off()
  sleep(1000)
  echo vm.settled_state()
  direShell "vboxmanage", "snapshot", vm, "take", name
  log &"Created snapshot {name}"

#--------------------------------------------------------
# Tasks
#--------------------------------------------------------

proc ensure_project_mount() =
  # vm.ensure_shared_folder(project_dir, "project")
  vm.ensure_mount(project_dir, "project")

task "node.msi", "Fetch node.msi":
  if not fileExists("tmp"/"node.msi"):
    log "Fetching node.msi ..."
    direShell "curl", "-L", NODE_MSI_URL, "-o", "tmp"/"node.msi"

task "yarn.msi", "Fetch yarn.msi":
  if not fileExists("tmp"/"yarn.msi"):
    log "Fetching yarn.msi ..."
    direShell "curl", "-L", YARN_MSI_URL, "-o", "tmp"/"yarn.msi"

task "python.msi", "Fetch python.msi":
  let dst = "tmp"/"python-2.7.15.msi"
  if not fileExists(dst):
    log &"Fetching {dst} ..."
    direShell "curl", "-L", PYTHON_MSI_URL, "-o", dst

task "vs-installer", "Fetch VS Installer":
  let dst = "tmp"/"BuildTools_Full.exe"
  if not fileExists(dst):
    log &"Fetching {dst} ..."
    direShell "curl", "-L", VS_INSTALLER_URL, "-o", dst

task "mingw-installer", "Fetch mingw64 installer":
  let dst = "tmp"/"mingw64.zip"
  if not fileExists(dst):
    log &"Fetching {dst} ..."
    direShell "curl", "-o", "tmp"/"mingw64.7z", "https://nim-lang.org/download/mingw64-6.3.0.7z"
    withDir("tmp"):
      direShell "7z", "x", "mingw64.7z"
      direShell "zip", "-r", "mingw64.zip", "mingw64"
      direShell "rm", "mingw64.7z"
      removeDir("mingw64")

task "setupwin.exe", "Build setupwin.exe":
  runTask "node.msi"
  runTask "yarn.msi"
  runTask "vs-installer"
  runTask "python.msi"
  runTask "mingw-installer"
  withLogPrefix("[setupwin.exe]"):
    let deps = @[
      "setupwin.nim",
      "tmp"/"node.msi",
      "tmp"/"yarn.msi",
    ]
    if "setupwin.exe".needsRefresh(deps):
      log "Building ..."
      direShell nimExe, "c", "-d:mingw", "--cpu:i386", "-o:setupwin.exe", "setupwin.nim"
    else:
      log "Already built"

task "winbuild.exe", "Build winbuild.exe":
  withLogPrefix("[winbuild.exe]"):
    if "winbuild.exe".needsRefresh("winbuild.nim"):
      log "Building ..."
      direShell nimExe, "c", "-d:mingw", "--cpu:i386", "-o:winbuild.exe", "winbuild.nim"
    else:
      log "Already built"

task "on", "Turn on the VM":
  withLogPrefix("[on]"):
    vm.turn_on()

task "off", "Turn off the VM":
  withLogPrefix("[off]"):
    vm.turn_off()

task "ready", "Make sure the VM is ready to receive actions":
  withLogPrefix("[ready]"):
    vm.ensure_signedin(win_user)

task "snap-guestadditions", "Install guest additions on vm":
  let snapshots = vm.snapshots()
  if not ("guestadditions" in snapshots):
    withLogPrefix("[snap-guestadditions]"):
      vm.turn_on(headless = false)
      writeStyled("Install guest additions:\L")
      echo &"""
      1. Open machine in VirtualBox GUI
      2. Sign in w/
         User: {win_user}
         Pass: {win_pass}
      3. Devices > Insert Guest Additions CD image...
      4. Eventually run the .exe on the CD and click through the installer.
      5. Reboot when prompted by the installer
      6. Wait for this script to detect changes (after the reboot) and take control again
      """
      vm.ensure_booted()
      vm.take_snapshot("guestadditions")

task "snap-users", "Set up VM users":
  let snapshots = vm.snapshots()
  if not ("users" in snapshots):
    withLogPrefix("[snap-users]"):
      vm.turn_on(headless = false)
      writeStyled("Enable auto login:\L")
      echo &"""
      1. Sign in w/
         User: {win_user}
         Pass: {win_pass}
      2. Click Start
      3. Type: netplwiz (then run it)
      4. Select IEUser
      5. Uncheck 'Users must enter a user name and password to use this computer.'
      6. Click 'Apply'
      7. Enter password: {win_pass}
      8. Click 'OK'
      9. Click 'OK'
      """
      writeStyled("Disable UAC:\L")
      echo &"""
      1. Click Start
      2. Type UAC (then press enter)
      3. Drag the slider all the way to the bottom
      4. Click OK and confirm
      """
      writeStyled("Disable Program Compatibility Assistant:\L")
      echo &"""
      1. Click Start
      2. Type: services.msc (then press enter)
      3. Double click "Program Compatibility Assistant Service"
      4. Change "Startup type:" to "Disabled"
      5. Click "Stop"
      6. Click "Apply"
      7. Click "OK"
      8. Close the Services app
      """
      writeStyled("Set Admin password and enable user:\L")
      echo &"""
      1. Click Start
      2. Type: cmd
      3. Right click and run Cmd as Administrator
      4. Run: net user Administrator /active:yes
      5. Run: net user Administrator *
      6. Type in the password: {admin_pass}
      7. Type the password in again: {admin_pass}
      
      Wait for this script to take control again...
      """
      while true:
        let output = getOutput(vm.gaAdminCmdArgs("echo", "hello"))
        if "hello" in output:
          break
        else:
          sleep(1000)
      vm.take_snapshot("users")

task "snap-node", "Install Node on vm":
  let snapshots = vm.snapshots()
  if not ("node" in snapshots):
    withLogPrefix("[snap-node]"):
      runTask "setupwin.exe"
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd("mkdir", r"c:\\builder")
      vm.gaDireCmd("xcopy", r"\\\\vboxsrv\\project\\app\\dev\\win\\setupwin.exe", r"c:\\builder\\", "/f", "/Y")
      for step in @["node", "yarn"]:
        log "-------------------------"
        log "Running step: ", step
        vm.gaDireCmd(r"c:\\builder\\setupwin.exe", step)
      vm.take_snapshot("node")

task "snap-buildtools", "Install build tools on vm":
  let snapshots = vm.snapshots()
  if not ("buildtools" in snapshots):
    withLogPrefix("[snap-buildtools]"):
      runTask "setupwin.exe"
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd("mkdir", r"c:\\builder")
      vm.gaDireCmd("xcopy", r"\\\\vboxsrv\\project\\app\\dev\\win\\setupwin.exe", r"c:\\builder\\", "/f", "/Y")
      for step in @["choco", "psexec", "buildtools"]:
        log "-------------------------"
        log "Running step: ", step
        vm.gaDireCmd(r"c:\\builder\\setupwin.exe", step)
      vm.take_snapshot("buildtools")

task "snap-nim", "Install Nim tools on vm":
  let snapshots = vm.snapshots()
  if not ("nim" in snapshots):
    withLogPrefix("[snap-nim]"):
      runTask "setupwin.exe"
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd("mkdir", r"c:\\builder")
      vm.gaDireCmd("xcopy", r"\\\\vboxsrv\\project\\app\\dev\\win\\setupwin.exe", r"c:\\builder\\", "/f", "/Y")
      for step in @["git", "gcc", "nim", "node-gyp", "nake"]:
        log "-------------------------"
        log "Running step: ", step
        vm.gaDireCmd(r"c:\\builder\\setupwin.exe", step)
      vm.take_snapshot("nim")

task "snap-env", "Set up all environment variables":
  let snapshots = vm.snapshots()
  if not ("env" in snapshots):
    withLogPrefix("[snap-env]"):
      runTask "setupwin.exe"
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd("mkdir", r"c:\\builder")
      vm.gaDireCmd("xcopy", r"\\\\vboxsrv\\project\\app\\dev\\win\\setupwin.exe", r"c:\\builder\\", "/f", "/Y")
      for step in @["env"]:
        log "-------------------------"
        log "Running step: ", step
        vm.gaDireCmd(r"c:\\builder\\setupwin.exe", step)
      vm.take_snapshot("env")

task "create", "Make sure the VM is created":
  runTask "snap-guestadditions"
  runTask "snap-users"
  runTask "snap-node"
  runTask "snap-buildtools"
  runTask "snap-nim"
  runTask "snap-env"

task "test", "Test":
  withLogPrefix("[test]"):
    # vm.ensure_shared_folder(project_dir, "project")
    echo vm.shared_folders()
    # vm.ensure_mount(project_dir, "project", "y")

task "prep-build", "Prepare for building":
  withLogPrefix("[prep-build]"):
    runTask "create"
    runTask "winbuild.exe"

task "build", "Build the electron app":
  runTask "prep-build"
  withLogPrefix("[build]"):
    withSigningCerts:
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd(r"\\\\vboxsrv\\project\\app\\dev\\win\\winbuild.exe", "CleanBuild")

task "build-beta", "Build Buckets Beta":
  runTask "prep-build"
  withLogPrefix("[build-beta]"):
    withSigningCerts:
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd(r"\\\\vboxsrv\\project\\app\\dev\\win\\winbuild.exe", "BuildBeta")

task "rebuild", "Build the electron app without cleaning first":
  runTask "prep-build"
  withLogPrefix("[build]"):
    withSigningCerts:
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd(r"\\\\vboxsrv\\project\\app\\dev\\win\\winbuild.exe", "Build")

task "publish", "Publish electron app":
  runTask "prep-build"
  withLogPrefix("[publish]"):
    withSigningCerts:
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd({"GH_TOKEN": getEnv("GH_TOKEN","")}.toTable(), r"\\\\vboxsrv\\project\\app\\dev\\win\\winbuild.exe", "Publish")

task "publish-beta", "Publish electron app":
  runTask "prep-build"
  withLogPrefix("[publish-beta]"):
    withSigningCerts:
      ensure_project_mount()
      vm.ensure_signedin(win_user)
      vm.gaCmd({"GH_TOKEN": getEnv("GH_TOKEN","")}.toTable(), r"\\\\vboxsrv\\project\\app\\dev\\win\\winbuild.exe", "PublishBeta")
