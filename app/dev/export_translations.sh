#!/bin/sh
DST="../../buckets-translations.git"
if [ ! -e "$DST" ]; then
    echo "ERROR: first make $DST"
    exit 1
fi

rsync -vrut src/langs/*.tsx "${DST}/langs"

echo
echo "Now go to ${DST} to send to GitHub"