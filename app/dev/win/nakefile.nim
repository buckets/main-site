import nake
import sequtils
import osproc
import re
import strutils
import strformat
import base64

#--------------------------------------------------------
# Variables
#--------------------------------------------------------
type
  VirtualMachine = string
  VmState = enum
    Unknown,
    PoweredOff,
    Aborted,
    Running,
    Paused,
    Stuck,
    Saved,
    Starting,
    Restoring,
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
  body
  discard log_prefix.pop()

template log(x:varargs[untyped]) =
  for i in log_prefix:
    stdout.write(i & " ")
  echo x

#--------------------------------------------------------
# output commands
#--------------------------------------------------------
proc getOutput(cmd: varargs[string, `$`]): string =
  execProcess(cmd[0], args = cmd[1..^1],
    options = {poStdErrToStdOut, poUsePath})

#--------------------------------------------------------
# helpers
#--------------------------------------------------------

proc gaCmdArgs(vm:VirtualMachine, args:varargs[string, `$`]):seq[string] =
  result = @["vboxmanage", "guestcontrol", vm, "run",
  "--username", win_user, "--password", win_pass,
  "--unquoted-args", "--", "cmd.exe", "/c"]
  result.add(args)

proc gaCmd(vm:VirtualMachine, args:varargs[string, `$`]) =
  ## Execute a guest additions command
  let all_args = vm.gaCmdArgs(args)
  shell(all_args)

proc gaAdminCmdArgs(vm:VirtualMachine, args:varargs[string, `$`]):seq[string] =
  result = @["vboxmanage", "guestcontrol", vm, "run",
  "--username", admin_user, "--password", admin_pass,
  "--unquoted-args", "--", "cmd.exe", "/c"]
  result.add(args)

proc gaAdminCmd(vm:VirtualMachine, args:varargs[string, `$`]) =
  ## Execute a guest additions command
  let all_args = vm.gaAdminCmdArgs(args)
  shell(all_args)

proc status_text(vm:VirtualMachine): string =
  getOutput("vboxmanage", "showvminfo", "--machinereadable", vm)

proc state(vm:VirtualMachine): VmState =
  let output = vm.status_text()
  if output =~ rex(""".*?^VMState="(.*?)"$.*?""", {reStudy, reDotAll, reMultiLine}):
    case matches[0]
    of "poweredoff": result = PoweredOff
    of "aborted": result = Aborted
    of "starting": result = Starting
    of "running": result = Running
    of "restoring": result = Restoring
    of "paused": result = Paused
    of "stuck": result = Stuck
    of "onlinesnapshotting": result = OnlineSnapshotting
    of "saving": result = Saving
    of "saved": result = Saved
    of "stopping": result = Stopping
    else: result = Unknown

proc settled_state(vm:VirtualMachine):VmState =
  while true:
    let state = vm.state()
    case state
    of Starting,Restoring,OnlineSnapshotting,Saving:
      discard
    else:
      return state
    sleep(1000)

proc turn_on(vm:VirtualMachine) =
  let state = vm.settled_state()
  case state
  of Aborted,PoweredOff,Unknown,Paused,Saved:
    # turn it on
    log "Starting the VM..."
    direShell "vboxmanage", "startvm", vm
    while vm.state() == Starting:
      sleep(100)
    let final_state = vm.settled_state()
    if final_state == Running:
      log vm, " is on"
      return
    else:
      log "Unexpeected state: ", final_state
      quit(1)
  of Starting,Restoring,OnlineSnapshotting,Saving,Stopping:
    log "Invalid state: ", state
    quit(1)
  of Running:
    # it's already on
    discard
  of Stuck:
    log "VM is stuck"
    quit(1)

proc turn_off(vm:VirtualMachine) =
  var state = vm.settled_state()
  case state
  of Aborted,PoweredOff,Unknown,Paused,Saved:
    return
  of Starting,Restoring,OnlineSnapshotting,Saving,Stopping:
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
      echo output
      break
    else:
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
    if not(state in {Aborted,PoweredOff,Unknown,Paused,Saved}):
      vm.turn_off()
    shell "vboxmanage", "sharedfolder", "add", vm, "--name", sharename, "--hostpath", hostdir
    log "Added shared folder ", hostdir, " -> ", sharename

proc ensure_mount(vm:VirtualMachine, hostdir:string, sharename:string, drive:string) =
  withLogPrefix(&"(mount {drive}:)"):
    vm.ensure_shared_folder(hostdir, sharename)
    vm.ensure_signedin(win_user)
    let expected = drive.toLowerAscii & ":"
    for i in 0..30:
      log &"Mounting '{sharename}' to {expected}"
      let output = getOutput(vm.gaCmdArgs("net", "use", expected, "\\\\vboxsvr\\"&sharename))
      if "local device name is already in use" in output:
        log output
        log "Unmounting ", expected
        vm.gaCmd("net", "use", expected, "/delete")
      elif "has a remembered connection" in output:
        log output
        log "Unmounting ", expected
        vm.gaCmd("net", "use", expected, "/delete")
      elif "The network name cannot be found" in output:
        log output
      elif "completed successfully" in output:
        let listing = getOutput(vm.gaCmdArgs("net", "use"))
        echo listing
        if expected in listing.toLowerAscii():
          log &"Mounted '{sharename}' to {expected}"
          return
      sleep(1000)
    raise newException(CatchableError, "Error mounting :(")

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

#--------------------------------------------------------
# Tasks
#--------------------------------------------------------

proc ensure_project_mount() =
  vm.ensure_mount(project_dir, "project", "y")

task "setupwin.exe", "Build setupwin.exe":
  withLogPrefix("[setupwin.exe]"):
    if "setupwin.exe".needsRefresh(@["setupwin.nim"]):
      log "Building ..."
      direShell nimExe, "c", "-d:mingw", "--cpu:amd64", "-o:setupwin.exe", "setupwin.nim"
    else:
      log "Already built"

task "winbuild.exe", "Build winbuild.exe":
  withLogPrefix("[winbuild.exe]"):
    if "winbuild.exe".needsRefresh("winbuild.nim"):
      log "Building ..."
      direShell nimExe, "c", "-d:mingw", "--cpu:amd64", "-o:winbuild.exe", "winbuild.nim"
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

task "snap-nim", "Install Nim tools on vm":
  let snapshots = vm.snapshots()
  if not ("nim" in snapshots):
    withLogPrefix("[snap-nim]"):
      runTask "setupwin.exe"
      vm.ensure_signedin(win_user)
      ensure_project_mount()
      vm.gaCmd("mkdir", r"c:\\builder")
      vm.gaCmd("xcopy", r"y:\\app\\dev\\win\\setupwin.exe", r"c:\\builder\\", "/f", "/Y")
      vm.gaCmd("set")
      vm.gaCmd("where", "git")
      echo "PATH = "
      vm.gaCmd("echo", "%PATH%")
      for step in ["git", "gcc"]:
        log "Running step: ", step
        vm.gaAdminCmd(r"c:\\builder\\setupwin.exe", step)
      for step in ["nim", "nake"]:
        log "Running step: ", step
        vm.gaCmd(r"c:\\builder\\setupwin.exe", step)

task "create", "Make sure the VM is created":
  runTask "snap-nim"

task "test", "Test":
  withLogPrefix("[test]"):
    # vm.ensure_shared_folder(project_dir, "project")
    echo vm.shared_folders()
    vm.ensure_mount(project_dir, "project", "y")

task "prep-build", "Prepare for building":
  withLogPrefix("[prep-build]"):
    runTask "create"
    try:
      let
        csc_link = getEnv("CSC_LINK", "")
        csc_key_password = getEnv("CSC_KEY_PASSWORD", "")
      if csc_link != "" and csc_key_password != "":
        log "Preparing code signing certificate ..."
        writeFile(project_dir/"csc_link.p12", csc_link.encode())
        writeFile(project_dir/"csc_key_password.txt", csc_key_password)
      runTask "winbuild.exe"

      vm.ensure_signedin(win_user)
      ensure_project_mount()
    finally:
      log "Removing code signing certificate ..."
      removeFile(project_dir/"csc_link.p12")
      removeFile(project_dir/"csc_key_password.txt")

task "build", "Build the electron app":
  runTask "prep-build"
  withLogPrefix("[build]"):
    vm.ensure_signedin(win_user)
    vm.gaCmd(r"y:\\app\\dev\\win\\winbuild.exe", "build")
    log "done?"
