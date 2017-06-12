#!/bin/bash

extraargs="$*"
for i in $(find src -name "jestconfig.json"); do
    set -x
    jest -c "$i" $*
done
