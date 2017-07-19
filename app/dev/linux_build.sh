#!/bin/bash
# This is run on the macOS host

set -e

TAG="buckets/linuxbuilder"
echo "BUILDING..."
docker build --file dev/linuxbuilder.Dockerfile -t $TAG .

echo
echo "RUNNING electron build..."
docker run -i -v $(pwd):/code --env GH_TOKEN="$GH_TOKEN" $TAG
