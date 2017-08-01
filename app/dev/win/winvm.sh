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
NODE_MSI_URL="https://nodejs.org/dist/v8.2.1/node-v8.2.1-x86.msi"
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

do_start() {
    vboxmanage startvm "$VMNAME" --type headless
}

do_up() {
    echo "do_up"
    setlogprefix "[do_up]"
    do_create
    ensure_booted
}

do_restore() {
    restore_to "${1:-buildtools}"
}

do_build() {
    APPDIR=${1:-.}
    APPDIR=$(abspath "$APPDIR")
    echo "do_build $APPDIR"
    do_up
    ensure_shared_folder project "$APPDIR" y
    ensure_mount project y
    echo | cmd 'c:\builder\win_build.bat'
}

do_rebuild() {
    echo "do_rebuild"
    APPDIR=${1:-.}
    APPDIR=$(abspath "$APPDIR")
    do_up
    echo | cmd 'c:\builder\win_build.bat'   
}

do_publish() {
    echo "do_publish"
    if [ -z "$GH_TOKEN" ]; then
        echo "Set GH_TOKEN"
        exit 1
    fi
    APPDIR=${1:-.}
    APPDIR=$(abspath "$APPDIR")
    do_build "$APPDIR"
    echo | vboxmanage guestcontrol "$VMNAME" run \
        --username "$WIN_USER" --password "$WIN_PASS" \
        --putenv GH_TOKEN="$GH_TOKEN" \
        --unquoted-args \
        -- cmd.exe /c 'c:\builder\win_build.bat' publish
}

do_dev() {
    APPDIR=${1:-.}
    APPDIR=$(abspath "$APPDIR")
    do_up
    echo | cmd 'c:\builder\win_build.bat dev'
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
    if ! vboxmanage showvminfo "$VMNAME" 2>/dev/null | grep "powered off" > /dev/null; then
        vboxmanage controlvm "$VMNAME" acpipowerbutton
    fi
    i="0"
    while ! vboxmanage showvminfo "$VMNAME" 2>/dev/null | grep "powered off" > /dev/null; do
        let i="$i + 1"
        if [ "$i" -eq 15 ]; then
            vboxmanage controlvm "$VMNAME" poweroff
        fi
        sleep 1
    done
}

ensure_on() {
    if ! vboxmanage showvminfo "$VMNAME" | grep "running" >/dev/null; then
        vboxmanage startvm "$VMNAME" --type headless
    fi
    while ! vboxmanage showvminfo "$VMNAME" | grep "running" >/dev/null; do
        sleep 1
    done
}

ensure_booted() {
    ensure_on

    # wait for guest additions to be started
    while ! cmd echo hello 2>/dev/null | grep "hello" >/dev/null; do
        sleep 1
    done
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

        vboxmanage startvm "$VMNAME" --type headless
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
    ensure_booted
}

snapshot_admin() {
    echo "starting admin snapshot"
    ensure_on
    echo
    echo "Please set the Administrator's password to '$ADMIN_PASS' using the GUI"
    echo "1. Click Start"
    echo "2. Right click 'Computer'"
    echo "3. Click 'Manage'"
    echo "4. Expand 'Local Users and Groups'"
    echo "5. Click 'Users' folder"
    echo "6. Right click 'Administrator'"
    echo "7. Click 'Set Password...'"
    echo
    echo "    set the password to 'admin'"
    echo
    echo "Also enable the user:"
    echo "1. Right click 'Administrator'"
    echo "2. Click 'Properties'"
    echo "3. Uncheck 'Account is disabled'"
    echo "4. Click 'OK'"

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
    echo "Installing ncat"
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
    ensure_shared_folder buildshare "$THISDIR"

    ensure_mount buildshare x
    set -x
    cmd 'c:\builder\bootstrap.bat'
    admincmd 'c:\builder\win_installbuildtools.bat'
    cmd 'npm config set msvs_version 2015'
    cmd 'npm config set python C:\Users\IEUser\.windows-build-tools\python27\python.exe'
    cmd 'npm install -g node-gyp'
    cmd 'set'
    set +x
    echo
    echo "Build tools installed"

    # unshare folder
    cmd 'net use x: /delete'
    ensure_off
    vboxmanage sharedfolder remove "$VMNAME" \
            --name "buildshare"
}

share_directory() {
    HOST_DIR=$1

}

do_${CMD} "${@:2}"