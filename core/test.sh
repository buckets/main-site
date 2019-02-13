#!/bin/bash

extraargs="$*"
export TAP_RCFILE=".taprc"
[ ! -d dist ] && tsc
set -e
for filename in $(find dist -name "*.test.js"); do
    echo "--------------------------------------------"
    echo "$filename"
    echo "--------------------------------------------"
    node "$filename"
done
# find dist -name "*.test.js" | xargs valgrind --tool=memcheck --leak-check=summary --show-leak-kinds=all tap -j 1 $* --