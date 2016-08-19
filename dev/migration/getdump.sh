#!/bin/bash

OUTPUT_FILE=${1:-live.dump}

set -e
rhc ssh pybuckets --command 'pg_dump --blobs --no-privileges --no-owner' \
    | sed -e s/public/oldschema/ \
    > "$OUTPUT_FILE"
