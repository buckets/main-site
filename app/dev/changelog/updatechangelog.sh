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
VERSION_HEADER=""
if echo "$version" | egrep '^.*\.0\.0' > /dev/null; then
    # major version
    VERSION_HEADER="# v${version}"
elif echo "$version" | egrep '^.*\.*\.0' > /dev/null; then
    # minor version
    VERSION_HEADER="## v${version}"
else
    # bugfix version
    VERSION_HEADER="### v${version}"
fi
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
