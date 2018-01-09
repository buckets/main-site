#!/bin/sh

rm -r ../app/docs
hugo --theme buckets-trimmed
mv public ../app/docs
