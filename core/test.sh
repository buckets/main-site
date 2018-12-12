#!/bin/bash

extraargs="$*"
export TAP_RCFILE=".taprc"
[ ! -d dist ] && tsc
find dist -name "*.test.js" | xargs tap $* --
