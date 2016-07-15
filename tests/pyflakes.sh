#!/bin/sh

find . -not -path '*/\.*' -name '*.py' | xargs pyflakes