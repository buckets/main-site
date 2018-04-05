#!/bin/bash

extraargs="$*"
export TAP_RCFILE=".taprc"
find src -name "*.test.js" | xargs tap $* --
