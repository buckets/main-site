#!/bin/sh

hugo
rsync -vrut public/* ../../docs.buckets.git/

echo "Now go push to origin in ../../docs.buckets.git/"
