#!/bin/sh
DST="../../buckets-translations.git"
if [ ! -e "$DST" ]; then
    echo "ERROR: first make $DST"
    exit 1
fi

set -e

rsync -vrut --exclude=defaults.tsx src/langs/*.tsx "${DST}/langs"

dev/insert_into_file.py -i "${DST}/README.md" -s '<!-- trans stats start -->' -e '<!-- trans stats end -->' --data "$(dev/transstats.sh)" --inplace

read -n1 -r -p "Press anything to proceeed with git push..." key

pushd "${DST}"
git commit -a -m "Update app strings"
git push origin master
popd
