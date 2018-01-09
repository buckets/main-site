#!/bin/sh

rm -r ../app/docs
hugo --theme buckets-trimmed --buildDrafts
mv public ../app/docs
