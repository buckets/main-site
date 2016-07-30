#!/bin/sh

set -e
tox
tests/testjs.sh
