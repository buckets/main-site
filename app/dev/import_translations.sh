#!/bin/sh
SRC="../../buckets-translations.git"
if [ ! -e "$SRC" ]; then
    echo "ERROR: first make $SRC"
    exit 1
fi

set -e

pushd "${SRC}"
git fetch origin
git merge origin/master
popd

rsync -vrut "${SRC}"/langs/*.tsx src/langs/
