#!/bin/bash
# This is run on the macOS host

set -e

CMD="$1"

ARGS=""

if [ "$CMD" == "publish" ]; then
    ARGS="--env GH_TOKEN=$GH_TOKEN"
fi

docker-clean -i -c

pushd ..

TAG="buckets/linuxbuilder"
echo "BUILDING..."
docker build --file app/dev/linux/linuxbuilder.Dockerfile -t $TAG .

echo
echo "RUNNING electron build..."
docker run -i -v "${HOME}/.yarnmirror":/yarnmirror -v $(pwd):/code $ARGS $TAG

popd
