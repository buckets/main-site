#!/bin/sh
SRC="../../buckets-translations.git"
if [ ! -e "$SRC" ]; then
    echo "ERROR: first make $SRC"
    exit 1
fi

rsync -vrut "${SRC}"/langs/*.tsx src/langs/
