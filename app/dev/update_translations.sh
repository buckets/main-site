#!/bin/bash

set -xe
echo
echo "Compiling..."
tsc -p nodesrc

echo
echo "Extracting..."
node nodesrc/dist/langutil.js extract src > src/langs/base.tsx

for langfile in $(ls src/langs/??.tsx); do
    if [ $(basename "$langfile") == "en.tsx" ]; then
        echo "(skipping en.tsx)"
        continue
    fi
    echo
    echo "Updating ${langfile}..."
    set -x
    node nodesrc/dist/langutil.js updatelang src/langs/base.tsx "$langfile"
    set +x
done

tsc
