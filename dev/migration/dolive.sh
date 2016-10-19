#!/bin/bash

set -xe
rhc ssh pybuckets --command 'echo working'

if [ ! -e 'live.dump' ]; then
    ./getdump.sh
fi


PGHOST=$(rhc ssh --command 'echo $OPENSHIFT_POSTGRESQL_DB_HOST')
PGUSER=$(rhc ssh --command 'echo $OPENSHIFT_POSTGRESQL_DB_USERNAME')
PGPASS=$(rhc ssh --command 'echo $OPENSHIFT_POSTGRESQL_DB_PASSWORD')

opentunnel() (
    rhc ssh --ssh "ssh -t -t -L 5432:${PGHOST}:5432" > /tmp/migration 2>&1
)
opentunnel &
CHILD_PID=$!
cleanup() {
    kill $CHILD_PID
}
trap cleanup EXIT

sleep 5
sleep 5

export DATABASE_URL="postgresql://${PGUSER}:${PGPASS}@127.0.0.1:5432/buckets"

./putdump.sh $DATABASE_URL
./wipe.sh $DATABASE_URL
./convert.sh $DATABASE_URL
