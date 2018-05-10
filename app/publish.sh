#!/bin/sh

set -e

if [ -z "$GH_TOKEN" ]; then
    echo "You must set the GH_TOKEN environment variable."
    echo "See README.md for more details."
    exit 1
fi

# This will build, package and upload the app to GitHub.
tsc

# macOS
ORIG_CSC_LINK="$CSC_LINK"
ORIG_CSC_KEY_PASSWORD="$CSC_KEY_PASSWORD"
if [ -z "$SKIP_MAC" ]; then
    unset CSC_LINK
    unset CSC_KEY_PASSWORD
    node_modules/.bin/build --mac -p always
fi

export CSC_LINK="$ORIG_CSC_LINK"
export CSC_KEY_PASSWORD="$ORIG_CSC_KEY_PASSWORD"

# linux
if [ -z "$SKIP_LINUX" ]; then
    dev/linux/linux_build.sh publish
fi

# windows
if [ -z "$SKIP_WIN" ]; then
    dev/win/winvm.sh publish "$(pwd)/.."
fi
