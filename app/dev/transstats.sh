#!/bin/bash

for langfile in $(ls src/langs/??.tsx); do
    translated=$(grep --count "translated: true" "$langfile")
    total=$(grep --count "translated: " "$langfile")
    if [ "$langfile" = "src/langs/en.tsx" ]; then
        percent="100"
    elif [ "$total" -eq 0 ]; then
        percent="100"
    else
        percent=$(python -c "print('%d' % ($translated * 100 / ${total}.0))")
    fi
    echo ${percent}% $langfile
done