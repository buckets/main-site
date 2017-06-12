#!/bin/bash

extraargs="$*"
childpids=""
for i in $(find src -name "tsconfig.json"); do
    tsc -p "$i" $* &
    childpid=$!
    childpids="$childpid $childpids"
done

for p in $childpids; do
    wait $childpids
done
# tsc -p src/core/tsconfig.json
# tsc -p src/pages/tsconfig.json
