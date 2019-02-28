#!/bin/bash
# This is run on the linux container

# copy to build_dir
set -xe

ACTION=${ACTION:-build}

yarn --version
node --version
npm --version
nim --version

export ELECTRON_BUILDER_CACHE="/proj/cache/electron-cache"
export ELECTRON_CACHE="/proj/cache/electron-cache"

yarn config set yarn-offline-mirror /proj/cache/yarnmirror

rsync -vrut \
    --exclude "node_modules" \
    --exclude "app/dist" \
    --exclude "nakefile" \
    --exclude ".nyc_output" \
    --exclude "cache" \
    --exclude "bizdev" \
    --exclude "mobile" \
    --exclude "staticweb" \
    --exclude "iconwork" \
    --exclude "docs" \
    --exclude "web" \
    --exclude "yarnmirror" \
    --exclude "app/dev/win" \
    /proj/* /build/
export PATH="./node_modules/.bin/:${PATH}"

cd /build/
nake clean
nake test
nake $ACTION

rsync -vrut "/build/app/dist/" "/proj/app/dist/"
