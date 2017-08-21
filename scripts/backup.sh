#!/bin/bash

OUTPUT_FILE="/Users/matt/.bucketsbackup/$(date +'%Y%m%d').sql"
D="$(dirname $OUTPUT_FILE)"
mkdir -p "$D"

set -e
set -x

rhc ssh buckets --command 'pg_dump --blobs --no-privileges --no-owner' > "$OUTPUT_FILE"

echo "Wrote $OUTPUT_FILE"
chmod 700 "$D"
chmod 600 ${D}/*
