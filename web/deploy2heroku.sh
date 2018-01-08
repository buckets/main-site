#!/bin/bash
pushd $(dirname $0)/.. ; git subtree push --prefix web heroku master ; popd
