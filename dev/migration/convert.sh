#!/bin/bash

DATABASE_URL=${1}

usage() {
    echo "$0 DATABASE_URL"
}

if [ -z "$DATABASE_URL" ]; then
    usage
    exit 1
fi

set -xe
cat conversion.sql \
    | psql -v ON_ERROR_STOP=1 --echo-queries "$DATABASE_URL"


