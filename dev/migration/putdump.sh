#!/bin/bash

DATABASE_URL=${1}
DUMPFILE=${2:-live.dump}

usage() {
    echo "$0 DATABASE_URL input_filename"
}

if [ -z "$DATABASE_URL" ] || [ -z "$DUMPFILE" ]; then
    usage
    exit 1
fi

set -xe
(
    echo 'DROP SCHEMA IF EXISTS oldschema CASCADE;' ;
    echo 'CREATE SCHEMA oldschema;' ;
    cat "$DUMPFILE"
) | psql "$DATABASE_URL"
