#!/usr/bin/env bash

set -e

#
# Remove *all* the issues from the specified repository.
#
# Usage : ./clear_issues.sh REPO
#
# REPO needs to be OWNER/NAME
#
# Requirements:
# - `gh`: The github cli configured.
#

REPO="$1"
[[ -z "${REPO}" ]] && echo "missing REPO argument" && exit 1

echo "Removing all the issues from ${REPO}"

gh --repo "$REPO" issue list --json number --state all --limit 100 \
	| jq -r '.[] | .number' \
	| xargs -n1 gh --repo "$REPO" issue delete
