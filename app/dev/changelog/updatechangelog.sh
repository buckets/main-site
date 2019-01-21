#!/bin/sh

set -e

# this isn't perfect, but it's close enough
thisdir="$(dirname $0)"
CHANGELOG="${thisdir}/../../CHANGELOG.md"
echo '<!-- THIS FILE IS AUTOMATICALLY UPDATED. SEE THE README -->' > _CHANGELOG.md

#---------------------------------------------------------------
# Version header
#---------------------------------------------------------------
version=$(cat "${thisdir}/../../package.json" | grep version | cut -d'"' -f4)
VERSION_DATE=$(date +"%Y-%m-%d")
VERSION_HEADER="## v${version} - ${VERSION_DATE}"
echo "$VERSION_HEADER" | tee -a _CHANGELOG.md
echo | tee -a _CHANGELOG.md

#---------------------------------------------------------------
# New changes
#---------------------------------------------------------------
"${thisdir}/combine_changes.sh" | tee -a _CHANGELOG.md

#---------------------------------------------------------------
# Old changelog
#---------------------------------------------------------------
tail -n +2 "${CHANGELOG}" | grep -v "$VERSION_HEADER" >> _CHANGELOG.md
mv _CHANGELOG.md "${CHANGELOG}"

#---------------------------------------------------------------
# Delete old snippets
#---------------------------------------------------------------
rm "${thisdir}"/../../changes/*-*.md
