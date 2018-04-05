#!/bin/bash
# This is run on the linux container

# copy to build_dir
ORIG_DIR="$(pwd)"
BUILD_DIR="/tmp/build_dir"

mkdir -p "$BUILD_DIR"
rsync -vrut \
    --exclude "dist/" \
    --exclude="node_modules/" \
    "${ORIG_DIR}/app/" "$BUILD_DIR"

pushd "$BUILD_DIR"
export PATH="/cache/node_modules/.bin/:${PATH}"

ARGS=""
if [ ! -z "$GH_TOKEN" ]; then
    ARGS="-p always"
fi

build --linux $ARGS

rsync -vrut "${BUILD_DIR}/dist/" "${ORIG_DIR}/app/dist"
