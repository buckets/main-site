#!/bin/bash

extraargs="$*"
export TAP_RCFILE=".taprc"
find dist -name "*.test.js" | xargs tap $* --
