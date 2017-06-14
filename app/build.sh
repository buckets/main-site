#!/bin/bash

extraargs="$*"
childpids=""
for i in $(find src -name "tsconfig.json"); do
    set -x
    tsc -p "$i" $* &
    childpid=$!
    set +x
    childpids="$childpid $childpids"
done

for p in $childpids; do
    wait $childpids
done
