#!/bin/bash
pushd $(dirname $0)/..
pwd
cd staticweb/
rm -r _site
python build.py
cd ..
git subtree push --prefix staticweb/_site github-main-site master
popd
