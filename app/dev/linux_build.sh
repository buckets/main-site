#!/bin/bash
# This is run on the macOS host

set -e

CMD="$1"

ARGS=""

if [ "$CMD" == "publish" ]; then
    ARGS="--env GH_TOKEN=$GH_TOKEN"
fi

TAG="buckets/linuxbuilder"
echo "BUILDING..."
docker build --file dev/linuxbuilder.Dockerfile -t $TAG .

echo
echo "RUNNING electron build..."
docker run -i -v $(pwd):/code $ARGS $TAG
