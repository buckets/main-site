#!/bin/bash
# This is run on the macOS host

set -xe

CMD="$1"

docker-clean -i -c

# go to the root of the project
while [ ! -d .git ]; do
    cd ..
done
pwd

TAG="buckets/linuxbuilder"
echo "BUILDING..."
docker build --file app/dev/linux/linuxbuilder.Dockerfile -t $TAG .

echo
echo "RUNNING electron build..."
docker run --rm -i \
    -v "$(pwd)":/proj \
    --env "GH_TOKEN=$GH_TOKEN" \
    --env "ACTION=$CMD" \
    $TAG

