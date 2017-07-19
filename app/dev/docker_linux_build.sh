#!/bin/bash
# This is run on the linux container

export PATH="/cache/node_modules/.bin/:${PATH}"

ARGS=""
if [ ! -z "$GH_TOKEN" ]; then
    ARGS="-p always"
fi

build --linux $ARGS
