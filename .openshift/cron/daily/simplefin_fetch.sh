#!/bin/bash

export DATABASE_URL=${OPENSHIFT_POSTGRESQL_DB_URL}
cd ${OPENSHIFT_REPO_DIR}

scripts/simplefin_fetch.py