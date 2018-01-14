#!/bin/sh

# this isn't perfect, but it's close enough
thisdir="$(dirname $0)"
PROJECT_ROOT="${thisdir}/../../"
CHANGE_ROOT="${PROJECT_ROOT}/changes"

log() {
    echo >&2 $* 
}

listtype() {
    for type in $@; do
        ls "${CHANGE_ROOT}"/${type}-*.md 2>/dev/null | sort
    done
}
catlinkified() {
    cat $1 | python ${thisdir}/linkifyissues.py
}

#---------------------------------------------------------------
# Change body
#---------------------------------------------------------------


for changefile in $(listtype break); do
    echo "- **BACKWARD INCOMPATIBLE:** $(catlinkified $changefile)"
    echo
done

for changefile in $(listtype feature new); do
    echo "- **NEW:** $(catlinkified $changefile)"
    echo
done

for changefile in $(listtype fix); do
    echo "- **FIX:** $(catlinkified $changefile)"
    echo
done

for changefile in $(listtype refactor info doc); do
    echo "- $(catlinkified $changefile)"
    echo
done

