#!/bin/bash

set -e

CMD=${1:-usage}
VMNAME=${2:-win7ie11v2}

THISDIR=$(python -c 'import os,sys; print os.path.abspath(os.path.dirname(sys.argv[1]))' "$0");

ISO_URL="https://az412801.vo.msecnd.net/vhd/VMBuild_20141027/VirtualBox/IE11/Windows/IE11.Win7.For.Windows.VirtualBox.zip"
ISO_DIR=${ISO_DIR:-${HOME}/iso}
OVA_FILENAME="Win7.ova"
OVA_PATH="${ISO_DIR}/${OVA_FILENAME}"
ZIP_FILENAME="IE11.Win7.For.Windows.VirtualBox.zip"
ZIP_PATH="${ISO_DIR}/${ZIP_FILENAME}"

YARN_MSI_URL="https://yarnpkg.com/latest.msi"
NODE_MSI_URL="https://nodejs.org/dist/v8.2.1/node-v8.2.1-x86.msi"

GUEST_ADDITIONS_ISO=${GUEST_ADDITIONS_ISO:-/Applications/VirtualBox.app/Contents/MacOS/VBoxGuestAdditions.iso}
HOST_ONLY_NETWORK="vboxnet0"

WIN_USER='IEUser'
WIN_PASS='Passw0rd!'
ADMIN_USER='Administrator'
ADMIN_PASS='admin'

RESOURCE_DIR="${THISDIR}/tmp"
mkdir -p "$RESOURCE_DIR"

do_usage() {
    cat <<EOF
Usage:

    $0 help     -- see this help.  See?
    $0 create   -- create $VMNAME vm
    $0 start    -- start $VMNAME vm
    $0 stop     -- stop $VMNAME vm
    $0 destroy  -- destroy $VMNAME vm
    $0 up       -- create and start $VMNAME vm
    $0 name     -- get $VMNAME
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
            mv "${TMPDIR}/*.ova" "$OVA_PATH"
            rmdir "$TMPDIR"
        fi

        echo "Importing ${OVA_FILENAME} -> ${VMNAME}"
        vboxmanage import "$OVA_PATH" --vsys 0 --vmname "$VMNAME"
    fi
    # ensure_off

    # # Configure network
    # vboxmanage modifyvm "$VMNAME" \
    #     --nic2 hostonly \
    #     --hostonlyadapter2 "$HOST_ONLY_NETWORK"

    ensure_snapshot genesis
    ensure_snapshot admin genesis
    ensure_snapshot node admin
}

do_start() {
    vboxmanage startvm "$VMNAME" --type headless
}

do_up() {
    do_create
    ensure_booted
}

guestcontrol() {
    set -e
    vboxmanage guestcontrol "$VMNAME" --username "$WIN_USER" --password "$WIN_PASS" $*
}
cmd() {
    set -e
    vboxmanage guestcontrol "$VMNAME" run --username "$WIN_USER" --password "$WIN_PASS" -- cmd.exe /c $*
}
run() {
    set -e
    vboxmanage guestcontrol "$VMNAME" run --username "$WIN_USER" --password "$WIN_PASS" -- $*
}
admincmd() {
    set -e
    vboxmanage guestcontrol "$VMNAME" run --username "$ADMIN_USER" --password "$ADMIN_PASS" -- cmd.exe /c $*
}

ensure_off() {
    if ! vboxmanage showvminfo "$VMNAME" | grep "powered off"; then
        vboxmanage controlvm "$VMNAME" acpipowerbutton
    fi
    i="0"
    while ! vboxmanage showvminfo "$VMNAME" | grep "powered off"; do
        let i="$i + 1"
        if [ "$i" -eq 30 ]; then
            vboxmanage controlvm "$VMNAME" poweroff
        fi
        sleep 1
    done
}

ensure_booted() {
    if ! vboxmanage showvminfo "$VMNAME" | grep "running" >/dev/null; then
        vboxmanage startvm "$VMNAME" --type headless
    fi
    while ! vboxmanage showvminfo "$VMNAME" | grep "running" >/dev/null; do
        sleep 1
    done

    # wait for guest additions to be started
    while ! cmd echo hello 2>/dev/null | grep "hello" >/dev/null; do
        sleep 1
    done
}

ensure_snapshot() {
    SNAPNAME=$1
    BASE_SNAPSHOT=$2
    if vboxmanage snapshot "$VMNAME" showvminfo "$SNAPNAME" >/dev/null 2>/dev/null; then
        echo "$SNAPNAME snapshot already exists"
    else
        if [ ! -z "$BASE_SNAPSHOT" ]; then
            echo "Restoring to $BASE_SNAPSHOT"
            ensure_off
            vboxmanage snapshot "$VMNAME" restore "$BASE_SNAPSHOT"
        fi
        echo
        echo "Creating $SNAPNAME snapshot..."

        vboxmanage startvm "$VMNAME" --type headless
        if ! snapshot_${SNAPNAME}; then
            echo "Error making snapshot :("
            exit 1
        fi
        echo "Turning off machine..."
        ensure_off
        vboxmanage snapshot "$VMNAME" \
            take "$SNAPNAME"
        echo "Created $SNAPNAME snapshot"
        echo
    fi
}

snapshot_genesis() {
    echo "Doing nothing for the genesis snapshot :)"
}

snapshot_admin() {
    ensure_booted
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
        echo "net use ..."
        OUTPUT="$(cmd net use x: "\\\\vboxsvr\\${SHARE_NAME}" 2>&1)"
        echo $OUTPUT
        if echo "$OUTPUT" | grep "local device name is already in use"; then
            echo 'unmounting x:'
            cmd net use x: /delete
        elif echo "$OUTPUT" | grep "The network name cannot be found"; then
            echo 'sleeping'
            sleep 1
        elif echo "$OUTPUT" | grep "completed successfully"; then
            echo 'OK'
            break
        else
            echo "Unknown response: $OUTPUT"
            exit 1
        fi
    done
}

snapshot_node() {
    echo "Installing node and yarn"
    set -e

    if [ ! -e "${RESOURCE_DIR}/node.msi" ]; then
        echo "Fetching node.msi"
        curl -L "${NODE_MSI_URL}" -o "${RESOURCE_DIR}/node.msi"
    fi
    if [ ! -e "${RESOURCE_DIR}/yarn.msi" ]; then
        echo "Fetching yarn.msi"
        curl -L "${YARN_MSI_URL}" -o "${RESOURCE_DIR}/yarn.msi"
    fi

    ensure_shared_folder project "$THISDIR"

    echo
    echo "Installing node and yarn..."
    guestcontrol mkdir '/foobar/'
    cmd 'xcopy x:\ c:\foobar\ /s /f'
    admincmd 'c:\foobar\win_installnode.bat'
    cmd 'node --version'
    cmd 'yarn --version'
    cmd 'npm --version'
    admincmd 'npm install --global --production windows-build-tools'
    cmd 'npm config get python'
    echo "Node installed"
}

share_directory() {
    HOST_DIR=$1

}

do_${CMD}