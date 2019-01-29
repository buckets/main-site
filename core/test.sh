#!/bin/bash

extraargs="$*"
export TAP_RCFILE=".taprc"
[ ! -d dist ] && tsc
# for filename in $(find dist -name "*.test.js"); do
#     node "$filename"
# done
find dist -name "*.test.js" | xargs tap $* --