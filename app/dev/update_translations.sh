#!/bin/bash

set -xe
echo
echo "Compiling..."
tsc -p nodesrc

echo
echo "Extracting..."
node nodesrc/dist/langutil.js extract src/langs/base.tsx src/langs/defaults.tsx src ../core/src

for langfile in $(ls src/langs/??.tsx); do
    echo
    echo "Updating ${langfile}..."
    set -x
    node nodesrc/dist/langutil.js updatelang src/langs/defaults.tsx "$langfile"
    set +x
done

tsc
