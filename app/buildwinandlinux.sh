#!/bin/bash

docker run --rm -ti -v ${PWD}:/project -v ${PWD##*/}-node-modules:/project/node_modules -v ~/.electron:/root/.electron electronuserland/electron-builder:wine /bin/bash -c 'yarn && build --win --linux'