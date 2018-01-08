#!/bin/bash
pushd $(dirname $0)/.. ; pwd; git subtree push --prefix web heroku master ; popd
