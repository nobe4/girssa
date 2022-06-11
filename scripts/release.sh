#!/usr/bin/env bash

#
# Create a new tag containing the release.
# It will read the VERSION file for the new release.
#
# Requirements:
# - `open`: Script to open an url in the default browser.
# - `gh`: The github cli configured.
# - a new version in VERSION file.
#
# It can take a number of arguments as environment variables:
# - TRACE: Show logs of this script's execution
# - MESSAGE: Custom message to use for the tag annotation
#

set -e
[[ -n "${TRACE}" ]] && set -x

# Run everything from the repository's root.
REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"
cd "${REPO_DIR}"

# Fetch versions
NEW_VERSION=$(cat VERSION)
git fetch --tags --force
LAST_VERSION=$(git describe --tags "$(git rev-list --tags --max-count=1)")

echo "Last release available at https://github.com/nobe4/girssa/releases/tag/${LAST_VERSION}"

if [[ "${LAST_VERSION}" = "${NEW_VERSION}" ]]; then
	echo "The version ${LAST_VERSION} has already been published."
	echo "Did you forget to bump it in VERSION?"
	exit 1
fi

if [[ -z "${MESSAGE}" ]]; then
	MESSAGE="${NEW_VERSION} release"
fi

echo "Creating a new tag ${NEW_VERSION}"
echo "Annotation: '${MESSAGE}'"

git tag \
	--sign \
	--annotate "${NEW_VERSION}" \
	--message "${MESSAGE}"

git push --tags

RELEASE_URL=$(gh release create \
	--draft \
	--generate-notes \
	--notes "@nobe4 to write something here" \
	--target main \
	--title "${NEW_VERSION}" \
	"${NEW_VERSION}"
)

echo "Opening ${RELEASE_URL} in the browser"
open "${RELEASE_URL}"
