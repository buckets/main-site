#!/bin/bash

set -e

CMD=${1:-usage}
VMNAME=${2:-win7ie11v2}

ISO_URL="https://az412801.vo.msecnd.net/vhd/VMBuild_20141027/VirtualBox/IE11/Windows/IE11.Win7.For.Windows.VirtualBox.zip"
ISO_DIR=${ISO_DIR:-${HOME}/iso}
OVA_FILENAME="Win7.ova"
OVA_PATH="${ISO_DIR}/${OVA_FILENAME}"
ZIP_FILENAME="IE11.Win7.For.Windows.VirtualBox.zip"
ZIP_PATH="${ISO_DIR}/${ZIP_FILENAME}"

GUEST_ADDITIONS_ISO=${GUEST_ADDITIONS_ISO:-/Applications/VirtualBox.app/Contents/MacOS/VBoxGuestAdditions.iso}
HOST_ONLY_NETWORK="vboxnet0"

WIN_USER='IEUser'
WIN_PASS='Passw0rd!'

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
        echo "To delete it, do"
        echo "  $0 destroy"
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

        ensure_off

        # Configure network
        vboxmanage modifyvm "$VMNAME" \
            --nic2 hostonly \
            --hostonlyadapter2 "$HOST_ONLY_NETWORK"

        make_snapshot genesis
    fi
}

do_start() {
    vboxmanage startvm "$VMNAME" --type headless
}

do_up() {
    do_create
    ensure_booted
}

cmd() {
    vboxmanage guestcontrol "$VMNAME" run --username "$WIN_USER" --password "$WIN_PASS" -- cmd.exe /c $*
}
run() {
    vboxmanage guestcontrol "$VMNAME" run --username "$WIN_USER" --password "$WIN_PASS" -- $*
}

ensure_off() {
    if ! vboxmanage showvminfo "$VMNAME" | grep "powered off"; then
        vboxmanage controlvm "$VMNAME" acpipowerbutton
    fi
    i="0"
    while ! vboxmanage showvminfo "$VMNAME" | grep "powered off"; do
        let i="$i + 1"
        if [ "$i" -eq 120 ]; then
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

make_snapshot() {
    SNAPNAME=$1
    BASE_SNAPSHOT=$2
    if vboxmanage snapshot "$VMNAME" showvminfo "$SNAPNAME" >/dev/null 2>/dev/null; then
        echo "$SNAPNAME snapshot already exists"
    else
        if [ ! -z "$BASE_SNAPSHOT" ]; then
            echo "Restoring to $BASE_SNAPSHOT"
            vboxmanage snapshot "$VMNAME" restore "$BASE_SNAPSHOT"
        fi
        echo "Creating $SNAPNAME snapshot..."

        vboxmanage startvm "$VMNAME" --type headless
        if ! make_snapshot_${SNAPNAME}; then
            echo "Error making snapshot :("
            exit 1
        fi
        echo "Turning off machine..."
        ensure_off
        vboxmanage snapshot "$VMNAME" \
            take "$SNAPNAME"
    fi
}

make_snapshot_genesis() {
    echo "Doing nothing for the genesis snapshot :)"
}

do_${CMD}