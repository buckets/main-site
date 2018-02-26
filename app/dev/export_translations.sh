#!/bin/sh
DST="../../buckets-translations.git"
if [ ! -e "$DST" ]; then
    echo "ERROR: first make $DST"
    exit 1
fi

set -e

rsync -vrut src/langs/*.tsx "${DST}/langs"

pushd "${DST}"
git commit -a -m "Update app strings"
git push origin master
popd
