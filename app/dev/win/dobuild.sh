#!/bin/bash

set -e
BUILD_DIR=$1
if [ -z "$BUILD_DIR" ]; then
    echo "Specify the application root dir"
    exit 1
fi

WIN_USER='IEUser'
WIN_PASS='Passw0rd!'
THISDIR=$(python -c 'import os,sys; print os.path.abspath(os.path.dirname(sys.argv[1]))' "$0");
VMNAME=${2:-$(${THISDIR}/winvm.sh name)}

echo "BUILD_DIR=$BUILD_DIR"
echo "SCRIPT_DIR=$THISDIR"
echo "VMNAME=$VMNAME"

${THISDIR}/winvm.sh up "$VMNAME"

SHARE_NAME="project"


echo "Sharing $BUILD_DIR as $SHARE_NAME"
# vboxmanage sharedfolder remove "$VMNAME" \
#     --name "$SHARE_NAME" || echo 'Warning: failed to remove old share'
# vboxmanage sharedfolder add "$VMNAME" \
#     --name "$SHARE_NAME" \
#     --hostpath "$BUILD_DIR"

guestcontrol() {
    vboxmanage guestcontrol "$VMNAME" --username "$WIN_USER" --password "$WIN_PASS" $*
}
cmd() {
    vboxmanage guestcontrol "$VMNAME" run --username "$WIN_USER" --password "$WIN_PASS" -- cmd.exe /c $*
}
run() {
    vboxmanage guestcontrol "$VMNAME" run --username "$WIN_USER" --password "$WIN_PASS" -- $*
}
set -x
cmd echo hello
cmd net use x: /delete || echo 'Warning: Failed to unmount'
cmd net use x: "\\\\vboxsvr\\${SHARE_NAME}"
cmd dir 'x:\'
# guestcontrol copyto --recursive --target-directory '/foobar/' "${BUILD_DIR}"
# cmd dir 'C:\foobar\'