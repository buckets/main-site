#!/bin/sh
# Run a shell command with TEST_DATABASE_URL set to a reachable,
# fresh postgres database.

set -e
CONTAINER_ID="$(docker run -e POSTGRES_PASSWORD=postgres -p 5432 -d postgres:9.5.3)"
finish() {
    echo "Destroying database at ${TEST_DATABASE_URL}"
    docker kill $CONTAINER_ID > /dev/null
    docker rm --volumes=true $CONTAINER_ID > /dev/null
}
trap finish EXIT

HOST="$(docker-machine ip)"
PORT="$(docker port ${CONTAINER_ID} 5432/tcp | cut -d: -f2)"

# Wait for the port to be open
while ! nc -z "$HOST" "$PORT"; do
    sleep 0.1
done

export TEST_DATABASE_URL="postgres://postgres:postgres@${HOST}:${PORT}/postgres"
echo "TEST_DATABASE_URL=${TEST_DATABASE_URL}"
$*
