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
(
    echo 'DROP SCHEMA IF EXISTS public CASCADE;' ;
    echo 'CREATE SCHEMA public;'
) | psql "$DATABASE_URL"

PYTHONPATH=$(dirname $0)/../../ python ../../upgrade_db.py -D "${DATABASE_URL}"
