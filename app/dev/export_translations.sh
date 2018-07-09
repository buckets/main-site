#!/bin/sh
DST="../../buckets-translations.git"
if [ ! -e "$DST" ]; then
    echo "ERROR: first make $DST"
    exit 1
fi

set -e

rsync -vrut --exclude=defaults.tsx src/langs/*.tsx "${DST}/langs"

dev/insert_into_file.py -i "${DST}/README.md" -s '<!-- trans stats start -->' -e '<!-- trans stats end -->' --data "$(dev/transstats.sh)" --inplace

pushd "${DST}"
git diff --stat
DELAY=5
echo "Will proceeed with git push in ${DELAY} seconds..."
sleep "$DELAY"

git commit -a -m "Update app strings" || echo "It's okay that there's nothing to commit"
git push origin master
popd
