#!/bin/bash

export DATABASE_URL=${OPENSHIFT_POSTGRESQL_DB_URL}
cd ${OPENSHIFT_REPO_DIR}

PYTHONPATH=. scripts/weeklystats.sh --email "haggardii+buckets@gmail.com"
