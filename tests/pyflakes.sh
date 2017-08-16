#!/bin/sh

find buckets -not -path '*/\.*' -name '*.py' | xargs pyflakes