#!/bin/sh

what=${1}

ARGS=""
if [ -z "$what" ]; then
    ARGS="--single-run"
elif [ "$what" = "watch" ]; then
    ARGS=""
fi

set -e
docker build -f tests/karma.Dockerfile -t local/karma .

docker run -it --rm -v $(pwd):/src -w /src -e NODE_ENV=CI local/karma \
    karma start tests/karma.conf.js $ARGS
