#!/bin/bash

set -e

CMD=${1:-usage}
VMOSTYPE=${VMOSTYPE:-win10}

abspath() (
    python -c 'import os,sys; print os.path.abspath(sys.argv[1])' "$1"
)

THISDIR=$(abspath "$(dirname "$0")")

if [ "$VMOSTYPE" == "win10" ]; then
    VMNAME=${VMNAME:-win10builder}
    ISO_URL="https://az792536.vo.msecnd.net/vms/VMBuild_20170320/VirtualBox/MSEdge/MSEdge.Win10.RS2.VirtualBox.zip"
    OVA_FILENAME="Win10.ova"
    ZIP_FILENAME="Win10.VirtualBox.zip"
elif [ "$VMOSTYPE" == "win8" ]; then
    VMNAME=${VMNAME:-win8builder}
    ISO_URL="https://az412801.vo.msecnd.net/vhd/VMBuild_20141027/VirtualBox/IE11/Windows/IE11.Win8.1.For.Windows.VirtualBox.zip"
    OVA_FILENAME="Win8.ova"
    ZIP_FILENAME="Win8.VirtualBox.zip"
else
    echo "Unknown VMOSTYPE: $VMOSTYPE"
    exit 1
fi

ISO_DIR=${ISO_DIR:-${HOME}/iso}
OVA_PATH="${ISO_DIR}/${OVA_FILENAME}"
ZIP_PATH="${ISO_DIR}/${ZIP_FILENAME}"

YARN_MSI_URL="https://yarnpkg.com/latest.msi"
NODE_MSI_URL="https://nodejs.org/dist/v11.8.0/node-v11.8.0-x86.msi"
NCAT_URL="http://nmap.org/dist/ncat-portable-5.59BETA1.zip"

GUEST_ADDITIONS_ISO=${GUEST_ADDITIONS_ISO:-/Applications/VirtualBox.app/Contents/MacOS/VBoxGuestAdditions.iso}
HOST_ONLY_NETWORK="vboxnet0"

WIN_USER='IEUser'
WIN_PASS='Passw0rd!'
ADMIN_USER='Administrator'
ADMIN_PASS='admin'

RESOURCE_DIR="${THISDIR}/tmp"
mkdir -p "$RESOURCE_DIR"

LOGPREFIX=""

log() {
    echo "$LOGPREFIX" $*
}
setlogprefix() {
    LOGPREFIX="$1"
}

do_usage() {
    cat <<EOF
Usage:

    $0 help         -- see this help.  See?
    $0 create       -- create $VMNAME vm
    $0 start        -- start $VMNAME vm
    $0 stop         -- stop $VMNAME vm
    $0 destroy      -- destroy $VMNAME vm
    $0 up           -- create and start $VMNAME vm
    $0 build DIR    -- build an electron app at DIR
    $0 rebuild DIR  -- rebuild an electron app at DIR
                       that has already been built
    $0 publish DIR  -- publish an electron app at DIR
    $0 name         -- get $VMNAME
EOF
}
do_help() {
    do_usage
}

do_name() {
    echo $VMNAME
}

do_stop() {
    ensure_off
}

do_destroy() {
    ensure_off
    vboxmanage unregistervm "$VMNAME" --delete
}


do_create() {
    echo "do_create"
    if vboxmanage showvminfo "$VMNAME" >/dev/null 2>/dev/null; then
        echo "$VMNAME already exists"
    else
        if [ ! -e "$OVA_PATH" ]; then
            echo "Need to get $OVA_PATH"
            if [ ! -e "$ZIP_PATH" ]; then
                echo "Need to get $ZIP_PATH"
                curl "$ISO_URL" -o "$ZIP_PATH"
            fi
            TMPDIR="/tmp/${OVA_PATH}"
            mkdir -p "$TMPDIR"
            unzip "$ZIP_PATH" -d "$TMPDIR"
            mv "${TMPDIR}"/*.ova "$OVA_PATH"
            rmdir "$TMPDIR"
        fi

        echo "Importing ${OVA_FILENAME} -> ${VMNAME}"
        vboxmanage import "$OVA_PATH" --vsys 0 --vmname "$VMNAME"
    fi

    ensure_snapshot genesis
    ensure_snapshot guestadditions genesis
    ensure_snapshot admin guestadditions
    ensure_snapshot ncat admin
    ensure_snapshot node ncat
    ensure_snapshot buildtools node
}

do_cmd() {
    set -x
    cmd $@
}
do_admincmd() {
    set -x
    admincmd $@
}

rununtiloutput() {
    SIGNAL="$1"
    CMD="${@:2}"
    FIFO=/var/tmp/winvm.stdout.fifo
    [ -e "$FIFO" ] && rm "$FIFO"
    mkfifo "$FIFO"
    $CMD >"$FIFO" &
    p="$!"
    echo "pid: $p"
    while true
    do
        if read line; then
            echo "$line"
            if echo "$line" | grep "$SIGNAL"; then
                kill $p
                break
            fi
        else
            break
        fi
    done <"$FIFO"
    echo "done"
    rm "$FIFO"
}

project_root_dir() {
    D="."
    while [ ! -e "${D}/.git" ]; do
        D="${D}/.."
    done
    echo "$(abspath "$D")"
}

do_start() {
    vboxmanage startvm "$VMNAME" # --type headless
}

do_up() {
    echo "do_up"
    setlogprefix "[do_up]"
    do_create
    ensure_off
    ensure_booted
}

do_restore() {
    restore_to "${1:-nim}"
}

do_prepare_build() {
    PROJECT_DIR=$(project_root_dir)
    echo "-----------------------------"
    echo "do_prepare_build $PROJECT_DIR"
    echo "-----------------------------"

    # code signing stuff
    if [ ! -z "$CSC_LINK" ] && [ ! -z "$CSC_KEY_PASSWORD" ]; then
        echo "Preparing code signing certificate..."
        echo "$CSC_LINK" | base64 --decode --input - --output "${PROJECT_DIR}/csc_link.p12"
        echo -n "$CSC_KEY_PASSWORD" > "${PROJECT_DIR}/csc_key_password.txt"
        function finish {
            echo "Removing code signing certificate..."
            rm "${PROJECT_DIR}/csc_link.p12"
            rm "${PROJECT_DIR}/csc_key_password.txt"
        }
        trap finish EXIT
    else
        echo "WARNING: no code signing (CSC_LINK and CSC_KEY_PASSWORD should be set)"
    fi

    # # build buckets.lib
    # echo "Building buckets.lib ..."
    # pushd "${PROJECT_DIR}/nodebuckets"
    # make clib/win/buckets.lib OS=win
    # popd
    # echo "Built buckets.lib"

    # build winbuild.ts
    echo "Building winbuild.ts ..."
    tsc -p "${PROJECT_DIR}/app/dev/win/tsconfig.json"
    echo "Built winbuild.ts"

    do_up window
    ensure_shared_folder project "$PROJECT_DIR" y
    ensure_mount project y
}

do_build() {
    echo "-----------------------------"
    echo "do_build"
    echo "-----------------------------"
    PROJECT_DIR=$(project_root_dir)
    echo "do_build $PROJECT_DIR"
    do_prepare_build "$PROJECT_DIR"
    ensure_signedin
    echo "running win_build_launcher.bat"
    echo | cmd 'c:\builder\win_build_launcher.bat build'
}

# do_testsetup() {
#     ensure_on
#     ensure_signedin
#     ensure_shared_folder buildshare "$THISDIR"
#     ensure_mount buildshare x
# }

# do_test() {
#     PROJECT_DIR=$(project_root_dir)
#     # build setupwin.exe
#     echo "Building setupwin.exe ..."
#     pushd "${PROJECT_DIR}/app/dev/win/"
#     make setupwin.exe
#     popd
#     echo "built setupwin.exe"

#     cmd 'c:\builder\bootstrap.bat'
#     for step in git gcc nim nake; do
#         echo
#         echo "... Doing $step step ..."
#         set -e
#         admincmd "c:\builder\setupwin.exe $step" | tee -a /tmp/bucketsbuild.log
#         set +e
#     done
#     echo
# }

do_rebuild() {
    echo "do_rebuild"
    PROJECT_DIR=$(project_root_dir)
    do_up
    echo | cmd 'c:\builder\win_build_launcher.bat build'
}

do_publish() {
    echo "do_publish"
    if [ -z "$GH_TOKEN" ]; then
        echo "Set GH_TOKEN"
        exit 1
    fi
    PROJECT_DIR=$(project_root_dir)
    do_prepare_build "$PROJECT_DIR"
    ensure_signedin
    echo | vboxmanage guestcontrol "$VMNAME" run \
        --username "$WIN_USER" --password "$WIN_PASS" \
        --putenv GH_TOKEN="$GH_TOKEN" \
        --unquoted-args \
        -- cmd.exe /c 'c:\builder\win_build_launcher.bat' publish
}

do_dev() {
    PROJECT_DIR=$(project_root_dir)
    do_up
    echo | cmd 'c:\builder\win_build_launcher.bat dev'
}

guestcontrol() {
    set -e
    vboxmanage guestcontrol "$VMNAME" --username "$WIN_USER" --password "$WIN_PASS" $@
}
cmd() {
    set -e
    vboxmanage guestcontrol "$VMNAME" run \
        --username "$WIN_USER" --password "$WIN_PASS" \
        --unquoted-args \
        -- cmd.exe /c $@
}
nohangcmd() {
    set -e
    vboxmanage guestcontrol "$VMNAME" run \
        --username "$WIN_USER" --password "$WIN_PASS" \
        --no-wait-stdout --no-wait-stderr \
        -- cmd.exe /c $@
}
admincmd() {
    set -e
    vboxmanage guestcontrol "$VMNAME" run \
        --username "$ADMIN_USER" --password "$ADMIN_PASS" \
        -- cmd.exe /c $@
}

ensure_off() {
    echo "Ensuring off..."
    if ! vboxmanage showvminfo "$VMNAME" 2>/dev/null | egrep "powered off|saved|aborted" > /dev/null; then
        echo "Pressing power button..."
        vboxmanage controlvm "$VMNAME" acpipowerbutton

    fi
    i="0"
    MAX_SECONDS=120
    echo "Waiting at most ${MAX_SECONDS}"
    while ! vboxmanage showvminfo "$VMNAME" 2>/dev/null | egrep "powered off|saved|aborted" > /dev/null; do
        let i="$i + 1"
        if [ "$i" -eq 20 ] || [ "$i" -eq 40 ] || [ "$i" -eq 60 ]; then
            echo "Pressing power button (again) ..."
            vboxmanage controlvm "$VMNAME" acpipowerbutton
        fi
        if [ "$i" -eq "$MAX_SECONDS" ]; then
            echo "Unplugging power..."
            vboxmanage controlvm "$VMNAME" poweroff
        fi
        sleep 1
    done
    echo "It's off"
}

ensure_on() {
    echo "Ensuring on..."
    if ! vboxmanage showvminfo "$VMNAME" | grep "running" >/dev/null; then
        vboxmanage startvm "$VMNAME" # --type headless
    fi
    while ! vboxmanage showvminfo "$VMNAME" | grep "running" >/dev/null; do
        sleep 1
    done
    echo "It's on"
}

ensure_booted() {
    echo "Ensuring booted..."
    ensure_on

    # wait for guest additions to be started
    while ! cmd echo hello 2>/dev/null | grep "hello" >/dev/null; do
        sleep 1
    done
    echo "It's booted."
}

ensure_signedin() {
    echo "-------------------------"
    echo "ensure_signedin"
    echo "-------------------------"
    echo "Waiting for $WIN_USER to be signed in..."
    while ! cmd query user | grep -i "$WIN_USER" >/dev/null; do
        sleep 1
    done
    echo "$WIN_USER is signed in."
}

restore_to() (
    SNAPNAME=$1
    setlogprefix "[restore_to $SNAPNAME]"
    echo "Restoring to $SNAPNAME"
    ensure_off
    vboxmanage snapshot "$VMNAME" restore "$SNAPNAME" 
)

ensure_snapshot() {
    SNAPNAME=$1
    BASE_SNAPSHOT=$2
    setlogprefix "[snapshot ${SNAPNAME}]"
    if vboxmanage snapshot "$VMNAME" showvminfo "$SNAPNAME" >/dev/null 2>/dev/null; then
        log "$SNAPNAME snapshot already exists"
    else
        if [ ! -z "$BASE_SNAPSHOT" ]; then
            restore_to "$BASE_SNAPSHOT"
        fi
        log
        log "Creating $SNAPNAME snapshot..."

        vboxmanage startvm "$VMNAME" # --type headless
        if ! snapshot_${SNAPNAME}; then
            log "Error making snapshot :("
            exit 1
        fi
        log "Turning off machine..."
        ensure_off
        vboxmanage snapshot "$VMNAME" \
            take "$SNAPNAME"
        log "Created $SNAPNAME snapshot"
        log
    fi
}

snapshot_genesis() {
    echo "Doing nothing for the genesis snapshot :)"
}

snapshot_guestadditions() {
    ensure_on
    echo "Please install guest additions"
    echo "1. Open machine in VirtualBox GUI"
    echo "2. Sign in w/"
    echo "   User: $WIN_USER"
    echo "   Pass: ${WIN_PASS}"
    echo "3. Devices > Insert Guest Additions CD image..."
    echo "4. Eventually run the .exe on the CD and click through the installer."
    echo "5. Reboot when prompted by the installer"
    echo "6. Wait for this script to detect changes (after the reboot) and take control again"
    ensure_booted
}

snapshot_admin() {
    echo "starting admin snapshot"
    ensure_on
    echo
    echo "Please enable auto-login"
    echo "1. Sign in w/"
    echo "   User: ${WIN_USER}"
    echo "   Pass: ${WIN_PASS}"
    echo "2. Click Start"
    echo "3. Type: netplwiz (then run it)"
    echo "4. Select IEUser"
    echo "5. Uncheck 'Users must enter a user name and password to use this computer.'"
    echo "6. Click 'Apply'"
    echo "7. Enter password: ${WIN_PASS} and click 'OK'"
    echo "8. Click 'OK'"
    echo
    echo "Please disable UAC"
    echo "1. Click the start orb"
    echo "2. Type: UAC (then press enter)"
    echo "3. Drag the slider all the way to the bottom"
    echo "4. Click OK and confirm"
    echo
    echo "Please set the Administrator's password to '${ADMIN_PASS}' using the GUI"
    echo "1. Sign in w/ (if you haven't yet)"
    echo "   User: ${WIN_USER}"
    echo "   Pass: ${WIN_PASS}"
    echo "2. Right click Windows Icon (bottom left)"
    echo "3. Type 'Computer Management' (press Enter)"
    echo "4. Expand 'Local Users and Groups'"
    echo "5. Click 'Users' folder"
    echo "6. Right click 'Administrator'"
    echo "7. Click 'Set Password...'"
    echo
    echo "    set the password to '${ADMIN_PASS}'"
    echo
    echo "Also enable the user:"
    echo "1. Right click 'Administrator'"
    echo "2. Click 'Properties'"
    echo "3. Uncheck 'Account is disabled'"
    echo "4. Click 'OK'"
    echo ""
    echo "Wait for this script to take control again..."

    while true; do
        if vboxmanage guestcontrol "$VMNAME" --username Administrator --password 'admin' run cmd.exe /c echo hey 2>/dev/null | grep hey; then
            break
        fi
        sleep 2;
    done
}

ensure_shared_folder() {
    SHARE_NAME=$1
    HOST_DIR=$2
    DEV="${3:-x}"
    echo "Ensuring shared folder present $SHARE_NAME $HOST_DIR $DEV"
    if [ -z "$SHARE_NAME" ] || [ -z "$HOST_DIR" ]; then
        echo "Error: Must provide SHARE_NAME HOST_DIR to ensure_shared_folder"
        exit 1
    fi
    
    ensure_off
    
    mkshare() {
        vboxmanage sharedfolder add "$VMNAME" \
            --name "$SHARE_NAME" \
            --hostpath "$HOST_DIR"
    }
    OUTPUT="$(mkshare 2>&1)"
    if echo "$OUTPUT" | grep 'already exists'; then
        echo "Removing existing share"
        vboxmanage sharedfolder remove "$VMNAME" \
            --name "$SHARE_NAME"
        mkshare
    fi
    
    ensure_booted

    echo "Sharing local directory ${HOST_DIR} as \\\\vboxsvr\\${SHARE_NAME}"
    while true; do
        set +e
        set -x
        OUTPUT="$(cmd net use ${DEV}: "\\\\vboxsvr\\${SHARE_NAME}" 2>&1)"
        set +x
        echo $OUTPUT
        if echo "$OUTPUT" | grep "local device name is already in use"; then
            echo "unmounting ${DEV}:"
            cmd net use ${DEV}: /delete
        elif echo "$OUTPUT" | grep "has a remembered connection"; then
            echo "unmounting ${DEV}:"
            cmd net use ${DEV}: /delete
        elif echo "$OUTPUT" | grep "The network name cannot be found"; then
            echo 'sleeping'
            sleep 1
        elif echo "$OUTPUT" | grep "completed successfully"; then
            echo 'OK'
            if ! cmd net use | grep -i "${DEV}:"; then
                sleep 1
            else
                break
            fi
        else
            echo "Unknown response: $OUTPUT"
            exit 1
        fi
    done
}

ensure_mount() {
    NAME="$1"
    DEV=${2:-x}
    while ! cmd net use | grep -i "${DEV}:"; do
        cmd net use ${DEV}: "\\\\vboxsvr\\${NAME}"
        sleep 1
    done
}


snapshot_ncat() {
    set -e
    echo "Start of ncat install"
    if [ ! -e "${RESOURCE_DIR}/ncat.exe" ]; then
        echo "No ncat.exe"
        ZIP_PATH="${RESOURCE_DIR}/ncat.zip"
        if [ ! -e "$ZIP_PATH" ]; then
            echo "Fetching ncat.zip"
            curl -L "${NCAT_URL}" -o "$ZIP_PATH"
        fi
        unzip "$ZIP_PATH" -d "$RESOURCE_DIR"
        mv "${RESOURCE_DIR}/ncat-portable-5.59BETA1/ncat.exe" "$RESOURCE_DIR"
        rm -r "${RESOURCE_DIR}/ncat-portable-5.59BETA1"
    fi

    echo
    echo "Ensuring shared folder..."
    ensure_shared_folder buildshare "$THISDIR"

    echo
    echo "Installing ncat..."
    ensure_mount buildshare x
    cmd 'md c:\builder'
    cmd 'echo net use x: \\vboxsvr\buildshare > c:\builder\bootstrap.bat'
    cmd 'echo xcopy x:\tmp\ncat.exe c:\windows\system32\ >> c:\builder\bootstrap.bat'
    cmd 'type c:\builder\bootstrap.bat'
    admincmd 'c:\builder\bootstrap.bat'
    echo "Done installing ncat"
}

snapshot_node() {
    set -e
    if [ ! -e "${RESOURCE_DIR}/node.msi" ]; then
        echo "Fetching node.msi"
        curl -L "${NODE_MSI_URL}" -o "${RESOURCE_DIR}/node.msi"
    fi
    if [ ! -e "${RESOURCE_DIR}/yarn.msi" ]; then
        echo "Fetching yarn.msi"
        curl -L "${YARN_MSI_URL}" -o "${RESOURCE_DIR}/yarn.msi"
    fi

    echo
    echo "Ensuring shared folder..."
    ensure_shared_folder buildshare "$THISDIR"

    echo
    echo "Installing node and yarn..."
    ensure_mount buildshare x
    cmd 'md c:\builder'
    cmd 'echo net use x: \\vboxsvr\buildshare > c:\builder\bootstrap.bat'
    cmd 'echo xcopy x:\ c:\builder\ /s /f /Y >> c:\builder\bootstrap.bat'
    cmd 'type c:\builder\bootstrap.bat'

    cmd 'c:\builder\bootstrap.bat'
    admincmd 'c:\builder\win_installnode.bat'
    echo "node: $(cmd 'node --version')"
    echo "yarn: $(cmd 'yarn --version')"
    echo "npm: $(cmd 'npm --version')"
    echo
    echo
    echo "npm config:"
    cmd 'npm config list'
    echo
    echo "Node installed"
}

snapshot_buildtools() {
    echo
    echo "Installing build tools..."

    # build winbuild.ts
    echo "Building winbuild.ts ..."
    tsc -p "${THISDIR}/tsconfig.json"
    echo "built winbuild.ts"

    ensure_shared_folder buildshare "$THISDIR"

    ensure_mount buildshare x
    set -x
    cmd 'c:\builder\bootstrap.bat'
    admincmd 'node c:\builder\winbuild.js installbuildtools'
    cmd 'node c:\builder\winbuild.js installnodegyp'
    # cmd 'npm config set msvs_version 2015'
    # cmd 'npm config set python C:\Users\IEUser\.windows-build-tools\python27\python.exe'
    # cmd 'npm install -g node-gyp'
    # cmd 'set'
    set +x
    echo
    echo "Build tools installed"

    # unshare folder
    cmd 'net use x: /delete'
    ensure_off
    sleep 10
    echo "Removing shared folder..."
    vboxmanage sharedfolder remove "$VMNAME" \
            --name "buildshare"
    echo "Done making buildtools snapshot"
}

snapshot_nim() {
    echo
    echo "Installing Nim..."
    
    ensure_signedin
    ensure_shared_folder buildshare "$THISDIR"
    ensure_mount buildshare x

    PROJECT_DIR=$(project_root_dir)
    # build setupwin.exe
    echo "Building setupwin.exe ..."
    pushd "${PROJECT_DIR}/app/dev/win/"
    make setupwin.exe
    popd
    echo "built setupwin.exe"

    cmd 'c:\builder\bootstrap.bat'
    for step in git gcc nim nake; do
        echo
        echo "... Doing $step step ..."
        set -e
        admincmd "c:\builder\setupwin.exe $step" | tee -a /tmp/bucketsbuild.log
        set +e
    done
    echo
    
    echo "Done making nim snapshot"
    echo "cleaning up..."
}


share_directory() {
    HOST_DIR=$1

}

do_${CMD} "${@:2}"