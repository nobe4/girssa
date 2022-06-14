#!/usr/bin/env bash

#
# Remove the specified tag.
# Use at your own risk.
#

set -ex

git push --delete origin "$1"
git tag -d "$1"
