#!/bin/bash

set -e
BUILD_DIR=$1
if [ -z "$BUILD_DIR" ]; then
    echo "Specify the application root dir"
    exit 1
fi

WIN_USER='IEUser'
WIN_PASS='Passw0rd!'
ADMIN_USER='Administrator'
ADMIN_PASS='admin'
THISDIR=$(python -c 'import os,sys; print os.path.abspath(os.path.dirname(sys.argv[1]))' "$0");
VMNAME=${2:-$(${THISDIR}/winvm.sh name)}

h1() {
    echo
    echo $*
    echo "==========================================================="
}

h1 start

echo "BUILD_DIR=$BUILD_DIR"
echo "SCRIPT_DIR=$THISDIR"
echo "VMNAME=$VMNAME"

${THISDIR}/winvm.sh create "$VMNAME"
${THISDIR}/winvm.sh restore
${THISDIR}/winvm.sh stop "$VMNAME"

TMPDIR="${THISDIR}/tmp"
mkdir -p "$TMPDIR"

SHARE_NAME="project"
h1 "Sharing $BUILD_DIR as $SHARE_NAME"

mkshare() {
    vboxmanage sharedfolder add "$VMNAME" \
        --name "$SHARE_NAME" \
        --hostpath "$BUILD_DIR"
}
OUTPUT="$(mkshare 2>&1)"
if echo "$OUTPUT" | grep 'already exists'; then
    echo "Removing existing share"
    vboxmanage sharedfolder remove "$VMNAME" \
        --name "$SHARE_NAME"
    mkshare
fi

${THISDIR}/winvm.sh up "$VMNAME"

guestcontrol() {
    vboxmanage guestcontrol "$VMNAME" --username "$WIN_USER" --password "$WIN_PASS" $*
}
cmd() {
    vboxmanage guestcontrol "$VMNAME" -vvvv run --username "$WIN_USER" --password "$WIN_PASS" -- cmd.exe /c $*
}
admincmd() {
    vboxmanage guestcontrol "$VMNAME" run --username "$ADMIN_USER" --password "$ADMIN_PASS" -- cmd.exe /c $*
}

h1 "Testing guestcontrol access"
cmd echo hello

h1 "Mounting shared directory"
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


set -e

h1 "Building the app..."
set -x
cmd 'x:\dev\win\win_build.bat'
# cmd "net use x: \\\\vboxsvr\\${SHARE_NAME} ; wmic logicaldisk get name"
# cmd 'x:\dev\win\win_installnode.bat'

# guestcontrol mkdir '/foobar/'
# guestcontrol copyto --follow --target-directory '/foobar/' "${BUILD_DIR}"
# cmd dir 'C:\foobar\'