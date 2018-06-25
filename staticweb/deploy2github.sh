#!/bin/bash
pushd $(dirname $0)/..
pwd
cd staticweb/
rm -r _site
python build.py
git add _site
git commit -m "New site"
cd ..
git subtree push --prefix staticweb/_site github-main-site master

# To force a push
#   git push github-main-site "$(git subtree split --prefix staticweb/_site/ master):master" --force
popd
