#!/bin/bash

set -e
echo "extracting messages..."
./dev/extract_translations.sh

tsc src/langs/build.tsx

for langfile in $(ls src/langs/??.tsx); do
    if [ $(basename "$langfile") == "en.tsx" ]; then
        echo "(skipping en.tsx)"
        continue
    fi
    echo "updating $langfile"
    node src/langutil/propagate.js src/langs/build.tsx "$langfile" >/dev/null
done

echo "you should run 'tsc' again"
