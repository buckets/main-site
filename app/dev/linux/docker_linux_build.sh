#!/bin/bash
# This is run on the linux container

# copy to build_dir
set -xe

yarn --version
node --version
npm --version

export ELECTRON_BUILDER_CACHE="/proj/cache/electron-cache"

yarn config set yarn-offline-mirror /proj/yarnmirror

rsync -vrut \
    --exclude "node_modules" \
    --exclude "app/dist" \
    --exclude ".nyc_output" \
    --exclude "yarnmirror" \
    --exclude "cache" \
    /proj/* /build/
export PATH="./node_modules/.bin/:${PATH}"
cd /build/core
yarn --ignore-scripts
tsc
cd /build/app
yarn --ignore-scripts
tsc

ARGS=""
if [ ! -z "$GH_TOKEN" ]; then
    ARGS="-p always"
fi

build --linux $ARGS

rsync -vrut "/build/app/dist/" "/proj/app/dist/"
